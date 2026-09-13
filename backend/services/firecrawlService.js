
import FirecrawlApp from "@mendable/firecrawl-js";
import axios from 'axios';
import { registry } from "../utils/circuitBreaker.js";

// Per-page scrape cap and search timeout
const FIRECRAWL_TIMEOUT_MS = 60_000;
const SEARCH_TIMEOUT_MS    = 90_000; // search + inline scraping takes longer than a bare search
const MAX_RETRIES          = 2;
const IS_PROD              = process.env.NODE_ENV === 'production';

/** Conditional logger — suppresses verbose output in production */
const log = {
    info:  (...args) => { if (!IS_PROD) console.log(...args); },
    warn:  (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};

// ── Property type → natural-language search term ─────
const PROPERTY_TYPE_SEARCH_TERMS = {
    'Flat':       'apartamento',
    'House':      'casa',
    'Villa':      'villa',
    'Plot':       'terreno',
    'Penthouse':  'cobertura',
    'Studio':     'kitnet',
    'Commercial': 'imóvel comercial',
};

// ── Multi-source search config───────────────────────────────────
// Each source contributes up to `limit` URLs per search.
const SEARCH_SOURCES = {
    'zapimoveis':    { domain: 'zapimoveis.com.br',     limit: 6 },
    'vivareal':      { domain: 'vivareal.com.br',       limit: 6 },
    'imovelweb':     { domain: 'imovelweb.com.br',      limit: 5 },
    'olx':           { domain: 'olx.com.br',            limit: 5 },
    'quintoandar':   { domain: 'quintoandar.com.br',    limit: 4 },
};

// ── Extraction schema (array-based) ──────────────────────────────────────────
// Works for both category pages (many listings) AND individual detail pages.
// The AI fills the array with however many FOR SALE properties it finds.
const SEARCH_RESULT_SCHEMA = {
    type: "object",
    properties: {
        properties: {
            type: "array",
            description: "All FOR SALE property listings found on this page. Skip rentals and temporary accommodations.",
            items: {
                type: "object",
                properties: {
                    building_name:          { type: "string", description: "Condominium or building name" },
                    builder_name:           { type: "string", description: "Construction company or developer" },
                    property_type:          { type: "string", description: "Apartment / House / Villa / Land / Penthouse / Studio / Commercial" },
                    T_config:             { type: "string", description: "e.g. 2 quartos, 3 dormitórios" },
                    location_address:       { type: "string", description: "Full address with neighborhood (bairro) and city" },
                    total_price:            { type: "string", description: "Total purchase price e.g. R$ 850.000, R$ 1.2 milhão" },
                    price_per_sqm:         { type: "string", description: "Price per square meter e.g. R$ 8.500/m²" },
                    area_sqm:              { type: "string", description: "Total area in square meters (m²)" },
                    private_area_sqm:      { type: "string", description: "Private area in square meters (m²)" },
                    floor_number:           { type: "string", description: "Floor number e.g. 5º andar" },
                    total_floors:           { type: "string", description: "Total floors in building" },
                    possession_status:      { type: "string", description: "Ready to Move (pronto para morar) / Under Construction (na planta) / Launch (lançamento)" },
                    facing_direction:       { type: "string", description: "East / West / North / South" },
                    parking_spots:          { type: "string", description: "Number of parking spots e.g. 1 vaga, 2 vagas" },
                    condominium_fee:        { type: "string", description: "Monthly condominium fee e.g. R$ 500/mês" },
                    iptu:                   { type: "string", description: "Annual IPTU property tax" },
                    amenities:              { type: "array", items: { type: "string" }, description: "Top 5 amenities (piscina, academia, portaria 24h, etc.)" },
                    nearby_landmarks:       { type: "array", items: { type: "string" }, description: "Nearby metro, schools, hospitals, shopping" },
                    description:            { type: "string", description: "Brief description max 50 words" },
                },
                required: ["building_name", "property_type", "location_address", "total_price"],
            },
        },
    },
    required: ["properties"],
};

const SEARCH_RESULT_PROMPT =
    "Extract all FOR SALE (compra/venda) property listings from this page. " +
    "Each property must have a total purchase price — NOT a rental price with 'aluguel', 'por mês', or '/mês'. " +
    "Skip rentals, temporary accommodations, and shared rooms (republicas, quartos para alugar) entirely. " +
    "If this is a category page with multiple listings, extract each one (up to 6). " +
    "If this is a single property detail page, extract that one property.";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the base search query (no site: filter — each source appends its own).
 * e.g. "apartamento 2 quartos para compra em Copacabana Rio de Janeiro até R$ 1.000.000"
 */
function buildSearchQuery({ city, locality, T, maxPrice, propertyType, possession }) {
    const parts = [];

    if (T && T !== 'Any') {
        const bedroomMatch = T.match(/^(\d+)\s*T$/i);
        if (bedroomMatch) {
            parts.push(`${bedroomMatch[1]} quartos`);
        } else {
            parts.push(T);
        }
    }

    const typeTerm = PROPERTY_TYPE_SEARCH_TERMS[propertyType] || 'imóvel';
    parts.push(typeTerm, 'para compra em');

    if (locality) parts.push(locality);
    parts.push(city);

    if (maxPrice) {
        const priceNum = parseFloat(maxPrice);
        parts.push(`até R$ ${formatPriceForSearch(priceNum)}`);
    }

    if (possession === 'ready') parts.push('pronto para morar');
    if (possession === 'under_construction') parts.push('na planta');

    return parts.join(' ');
}

/**
 * Format price for search query (Brazilian format)
 */
function formatPriceForSearch(priceInMillions) {
    if (priceInMillions >= 1) {
        return `${priceInMillions} milhão`;
    }
    return `${Math.round(priceInMillions * 1000000)}`;
}

/**
 * Parse a Brazilian price string to a float in Millions of Reais (R$).
 * Handles:
 * - "R$ 850.000" → 0.85
 * - "R$ 1.200.000" → 1.2
 * - "R$ 1,2 milhão" → 1.2
 * - "R$ 1.5M" → 1.5
 * - "850 mil" → 0.85
 * - "1.2 milhões" → 1.2
 * Returns null if the string looks like a rental price or can't be parsed.
 */
function parsePriceToMillions(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    
    const s = priceStr.toLowerCase().replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');

    // Reject rental price patterns
    if (/aluguel|mensal|\/mês|por mês|mesalidade/.test(priceStr.toLowerCase())) return null;

    // Handle "1,2 milhão" or "1.5 milhões"
    const milhaoMatch = s.match(/^([\d.]+)\s*milhões?/);
    if (milhaoMatch) return parseFloat(milhaoMatch[1]);

    // Handle "850 mil"
    const milMatch = s.match(/^([\d.]+)\s*mil/);
    if (milMatch) return parseFloat(milMatch[1]) / 1000;

    // Handle "1.5M"
    const mMatch = s.match(/^([\d.]+)m$/);
    if (mMatch) return parseFloat(mMatch[1]);

    // Handle raw number (e.g., 850000)
    const numMatch = s.match(/^([\d.]+)$/);
    if (numMatch) {
        const n = parseFloat(numMatch[1]);
        if (n > 100000) return n / 1_000_000;
        if (n > 1000) return n / 1000;
        return n;
    }

    return null;
}

/**
 * Deduplicate scraped properties.
 * Two properties are considered duplicates when they share the same
 * building name (case-insensitive) AND the same T config.
 */
function deduplicateProperties(properties) {
    const best = new Map();

    for (const p of properties) {
        const key = [
            (p.building_name || '').toLowerCase().trim(),
            (p.T_config    || '').toLowerCase().trim(),
        ].join('::');

        if (!best.has(key)) {
            best.set(key, p);
        } else {
            const existing = best.get(key);
            const countFilled = obj => Object.values(obj).filter(v => v && v !== '').length;
            if (countFilled(p) > countFilled(existing)) best.set(key, p);
        }
    }

    return Array.from(best.values());
}

/**
 * Round-robin interleave properties from different sources.
 */
function interleaveBySource(properties, limit) {
    const queues = {};
    for (const p of properties) {
        const src = p.source || 'unknown';
        if (!queues[src]) queues[src] = [];
        queues[src].push(p);
    }

    for (const src in queues) {
        queues[src].sort((a, b) => {
            const priceA = parsePriceToMillions(a.total_price || '0') || 0;
            const priceB = parsePriceToMillions(b.total_price || '0') || 0;
            return priceB - priceA;
        });
    }

    const groups = Object.values(queues);
    const result = [];
    let round = 0;
    while (result.length < limit) {
        let added = 0;
        for (const group of groups) {
            if (result.length >= limit) break;
            if (round < group.length) { result.push(group[round]); added++; }
        }
        if (added === 0) break;
        round++;
    }
    return result;
}

/**
 * Filter out rental listings and properties outside user's budget.
 */
function filterValidProperties(properties, minPrice, maxPrice) {
    const max = parseFloat(maxPrice) || 0;
    let min = parseFloat(minPrice) || 0;

    if (min === 0 && max >= 2) {
        min = max * 0.30;
    } else if (min === 0 && max >= 1) {
        min = max * 0.25;
    }

    return properties.filter(p => {
        const price = p.total_price || '';

        if (/aluguel|mensal|\/mês|por mês|republica|quarto para alugar/i.test(price)) return false;

        const url = p.property_url || '';
        if (/alugar|aluguel|para-alugar|quartos-compartilhados/.test(url)) return false;

        const priceInMillions = parsePriceToMillions(price);
        if (priceInMillions === null) return false;

        if (max > 0 && priceInMillions > max * 1.15) return false;
        if (min > 0 && priceInMillions < min * 0.85) return false;

        return true;
    });
}
/**
 * 
/**
 * 
Prevents injection attacks, removes problematic characters, normalizes whitespace, and enforces a maximum length on string inputs. */

function sanitize(input, maxLen = 60) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, maxLen);
}

function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`[Firecrawl] ${label} timed out after ${ms / 1000}s`)), ms)
        ),
    ]);
}

function isRetryableError(err) {
    const msg  = String(err?.message || '').toLowerCase();
    const code = err?.statusCode || err?.status || 0;
    if (msg.includes('err_tunnel_connection_failed') || msg.includes('proxy error') || msg.includes('internal proxy')) return 'proxy';
    if (code === 429 || msg.includes('rate limit')) return 'rate_limit';
    if (code === 503 || code === 502 || msg.includes('temporarily unavailable')) return 'server';
    return null;
}

function isUnauthorizedError(err) {
    const msg = String(err?.message || '').toLowerCase();
    const code = err?.statusCode || err?.status || 0;
    return code === 401 || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid token');
}

function isCreditsExhaustedError(err) {
    const msg = String(err?.message || '').toLowerCase();
    const code = err?.statusCode || err?.status || 0;
    return code === 402 || msg.includes('402') || msg.includes('insufficient credits') || msg.includes('credits exhausted');
}

// ── Service class ─────────────────────────────────────────────────────────────

class FirecrawlService {
    constructor(apiKey) {
        if (!apiKey) throw new Error('[FirecrawlService] API key is required — no fallback allowed.');
        this.apiKey = apiKey;
        this.firecrawl = new FirecrawlApp({ apiKey });

        this.searchCircuit = registry.getBreaker('firecrawl-search', {
            failureThreshold: 4,
            timeout: 120000,
            name: 'firecrawl-search'
        });

        this.scrapeCircuit = registry.getBreaker('firecrawl-scrape', {
            failureThreshold: 5,
            timeout: 90000,
            name: 'firecrawl-scrape'
        });
    }

    async validateApiKey() {
        try {
            await withTimeout(
                (typeof this.firecrawl.scrape === 'function'
                    ? this.firecrawl.scrape('https://example.com', { formats: ['markdown'] })
                    : this.firecrawl.scrapeUrl('https://example.com', { formats: ['markdown'] })),
                20_000,
                'validate-firecrawl-key-sdk'
            );
            return { valid: true, via: 'sdk' };
        } catch (sdkErr) {
            try {
                const response = await axios.post(
                    'https://api.firecrawl.dev/v2/scrape',
                    { url: 'https://example.com' },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 20_000,
                    }
                );

                if (response.status === 200 && response.data?.success !== false) {
                    return { valid: true, via: 'http' };
                }

                throw new Error(`Firecrawl direct validation failed: ${response.data?.error || 'Unknown error'}`);
            } catch (httpErr) {
                const status = httpErr?.response?.status;
                const detail = httpErr?.response?.data?.error || httpErr?.message || sdkErr?.message || 'Unknown error';
                const err = new Error(`[FirecrawlValidation] ${detail}`);
                err.statusCode = status || httpErr?.statusCode || 500;
                throw err;
            }
        }
    }

    async findProperties({
        city,
        locality       = '',
        T            = 'Any',
        minPrice       = '0',
        maxPrice       = '5',
        propertyType   = 'Flat',
        propertyCategory = 'Residential',
        possession     = 'any',
        includeNoBroker = false,
        limit          = 12,
    }) {
        try {
            city         = sanitize(city, 40);
            locality     = sanitize(locality, 40);
            propertyType = sanitize(propertyType, 20);

            if (!city) throw new Error('City name is required');

            const baseQuery = buildSearchQuery({ city, locality, T, maxPrice, propertyType, possession });

            const priceNum    = parseFloat(maxPrice);
            const budgetLabel = priceNum < 1
                ? `R$ ${Math.round(priceNum * 1000000).toLocaleString('pt-BR')}`
                : `R$ ${priceNum} milhão`;

            const activeSources = ['zapimoveis', 'vivareal', 'imovelweb', 'olx'];
            if (includeNoBroker) activeSources.push('quintoandar');

            console.log('\n[DEBUG] ─── Firecrawl Multi-Source Search (Brazil) ──────');
            console.log('[DEBUG] Base query   :', baseQuery);
            console.log('[DEBUG] Sources      :', activeSources.join(', '));
            console.log('[DEBUG] City         :', city, locality ? `| Bairro: ${locality}` : '');
            console.log('[DEBUG] Quartos      :', T);
            console.log('[DEBUG] Budget       :', minPrice, '–', maxPrice, 'M →', budgetLabel);
            console.log('[DEBUG] Type         :', propertyType);
            console.log('[DEBUG] Possession   :', possession);
            console.log('[DEBUG] QuintoAndar  :', includeNoBroker);
            console.log('[DEBUG] ────────────────────────────────────────────────\n');

            const searchPromises = activeSources.map(sourceKey => {
                const { domain, limit: srcLimit } = SEARCH_SOURCES[sourceKey];
                const query = `${baseQuery} site:${domain}`;

                return this.searchCircuit.execute(async () => {
                    const response = await withTimeout(
                        this.firecrawl.search(query, {
                            limit: srcLimit,
                            location: 'Brazil',
                            scrapeOptions: {
                                formats: [{
                                    type: 'json',
                                    prompt: SEARCH_RESULT_PROMPT,
                                    schema: SEARCH_RESULT_SCHEMA,
                                }],
                                onlyMainContent: true,
                            },
                        }),
                        SEARCH_TIMEOUT_MS,
                        `search:${sourceKey}`
                    );

                    const normalizedData = Array.isArray(response?.data)
                        ? response.data
                        : [
                            ...(Array.isArray(response?.web) ? response.web : []),
                            ...(Array.isArray(response?.news) ? response.news : []),
                            ...(Array.isArray(response?.images) ? response.images : []),
                        ];

                    return normalizedData;
                }).then(result => ({ sourceKey, data: Array.isArray(result) ? result : [], error: null }))
                .catch(err => {
                    log.warn(`[Firecrawl] Search failed for ${sourceKey}: ${err.message}`);
                    return { sourceKey, data: [], error: err };
                });
            });

            const searchResults = await Promise.all(searchPromises);

            const all402 = searchResults.every(r => r.error && isCreditsExhaustedError(r.error));
            if (all402) {
                const err = new Error('Firecrawl API credits exhausted. Please upgrade your plan at https://firecrawl.dev/pricing');
                err.code = 'FIRECRAWL_CREDITS_EXHAUSTED';
                err.statusCode = 402;
                throw err;
            }

            const allUnauthorized = searchResults.length > 0 && searchResults.every(r => r.error && isUnauthorizedError(r.error));
            if (allUnauthorized) {
                const err = new Error('Firecrawl API key is invalid or expired. Please update your Firecrawl key.');
                err.code = 'FIRECRAWL_AUTH_ERROR';
                err.statusCode = 401;
                throw err;
            }

            const allFailed = searchResults.length > 0 && searchResults.every(r => !!r.error);
            if (allFailed) {
                const err = new Error('All Firecrawl sources failed. Please try again in a few minutes.');
                err.code = 'FIRECRAWL_ERROR';
                err.statusCode = 503;
                throw err;
            }

            const rawProperties = searchResults.flatMap(({ sourceKey, data }) => {
                const extracted = [];
                for (const result of data) {
                    const items = result.json?.properties;
                    if (!Array.isArray(items) || items.length === 0) continue;
                    for (const prop of items) {
                        extracted.push({
                            ...prop,
                            property_url: result.url,
                            source:       sourceKey,
                        });
                    }
                }
                return extracted;
            });

            console.log('[DEBUG] ─── Search + Extract Results (all sources) ───────');
            searchResults.forEach(({ sourceKey, data }) => {
                const propCount = data.reduce((n, r) => n + (r.json?.properties?.length || 0), 0);
                console.log(`[DEBUG] ${sourceKey.padEnd(12)}: ${data.length} pages → ${propCount} properties`);
            });
            console.log('[DEBUG] Total raw properties :', rawProperties.length);
            rawProperties.forEach((p, i) =>
                console.log(`[DEBUG] [${i}] [${p.source}] name=${p.building_name} | price=${p.total_price} | quartos=${p.T_config}`)
            );
            console.log('[DEBUG] ────────────────────────────────────────────────\n');

            if (rawProperties.length === 0) {
                return { properties: [] };
            }

            const maxPriceNum = parseFloat(maxPrice) || 0;
            let smartMinPrice = parseFloat(minPrice) || 0;
            if (smartMinPrice === 0 && maxPriceNum >= 2) {
                smartMinPrice = maxPriceNum * 0.30;
            } else if (smartMinPrice === 0 && maxPriceNum >= 1) {
                smartMinPrice = maxPriceNum * 0.25;
            }
            if (smartMinPrice > 0) {
                console.log(`[DEBUG] Smart min price      : R$ ${smartMinPrice.toFixed(2)}M (${(smartMinPrice * 1000000).toLocaleString('pt-BR')} floor for R$ ${maxPriceNum}M budget)`);
            }

            const filtered = filterValidProperties(rawProperties, minPrice, maxPrice);
            const deduplicated = deduplicateProperties(filtered);

            console.log('[DEBUG] ─── After Filter + Dedup ───────────────────────');
            console.log('[DEBUG] After filter         :', filtered.length, '/', rawProperties.length);
            console.log('[DEBUG] After dedup          :', deduplicated.length);
            deduplicated.forEach((p, i) =>
                console.log(`[DEBUG] [${i}] ✓ [${p.source}] name=${p.building_name} | price=${p.total_price}`)
            );
            console.log('[DEBUG] ────────────────────────────────────────────────\n');

            const properties = interleaveBySource(deduplicated, limit).map(p => ({
                ...p,
                price:     p.total_price,
                area_sqm: p.area_sqm || p.private_area_sqm || '',
            }));

            log.info(`[Firecrawl] Returning ${properties.length} properties for ${city} (sources: ${activeSources.join(', ')})`);
            return { properties };

        } catch (error) {
            log.error('Error finding properties:', error.message || error);
            throw error;
        }
    }

    async getLocationTrends(city, limit = 5) {
        try {
            city = sanitize(city, 40);
            if (!city) throw new Error('City name is required');

            const formattedLocation = city.toLowerCase().replace(/\s+/g, '-');
            const url = `https://www.zapimoveis.com.br/preco-de-imoveis/${formattedLocation}/`;

            const locationSchema = {
                type: "object",
                properties: {
                    locations: {
                        type: "array",
                        description: `Price trend data for ${limit} neighborhoods (bairros) in ${city}`,
                        items: {
                            type: "object",
                            properties: {
                                location:         { type: "string" },
                                price_per_sqm:   { type: "number" },
                                percent_increase: { type: "number" },
                                rental_yield:     { type: "number" },
                            },
                            required: ["location", "price_per_sqm", "percent_increase", "rental_yield"],
                        },
                    },
                },
                required: ["locations"],
            };

            log.info(`[Firecrawl] Scraping trends from: ${url}`);
            const scrapeResult = await this._scrapeWithRetry(url, {
                formats: [{
                    type: 'json',
                    prompt: `Extract price trend data for ${limit} major neighborhoods (bairros) in ${city}. Include neighborhood name, price per square meter (R$/m²), yearly percent increase, and rental yield.`,
                    schema: locationSchema,
                }],
                waitFor:         10000,
                timeout:         FIRECRAWL_TIMEOUT_MS,
                onlyMainContent: true,
            }, `getLocationTrends(${city})`);

            const rawLocations = scrapeResult.json?.locations || [];
            const locations    = rawLocations.slice(0, limit);
            log.info(`[Firecrawl] Extracted ${rawLocations.length} locations, returning ${locations.length}`);
            return { locations };

        } catch (error) {
            log.error('Error fetching location trends:', error.message || error);
            throw error;
        }
    }

    async _scrapeWithRetry(url, baseOpts, label) {
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const useGeo = attempt === 0;
            const opts   = useGeo ? { ...baseOpts, location: { country: "BR" } } : { ...baseOpts };

            try {
                const result = await this.scrapeCircuit.execute(async () => {
                    const scrapeMethod = typeof this.firecrawl.scrape === 'function'
                        ? this.firecrawl.scrape.bind(this.firecrawl)
                        : this.firecrawl.scrapeUrl.bind(this.firecrawl);

                    return await withTimeout(
                        scrapeMethod(url, opts),
                        FIRECRAWL_TIMEOUT_MS,
                        `${label} (attempt ${attempt + 1})`
                    );
                });

                if (!result || result.success === false) {
                    throw new Error(`Firecrawl error: ${result.error || 'Unknown'}`);
                }
                return result;
            } catch (err) {
                lastError = err;
                const reason = isRetryableError(err);
                if (!reason || attempt === MAX_RETRIES) break;

                const delayMs = reason === 'rate_limit' ? 3000 : reason === 'proxy' ? 2000 : 1000;
                log.warn(`[Firecrawl] ${reason} on attempt ${attempt + 1}, retrying in ${delayMs / 1000}s…`);
                await new Promise(r => setTimeout(r, delayMs));
            }
        }

        throw lastError;
    }
}

export function createFirecrawlService(apiKey) {
    return new FirecrawlService(apiKey);
}