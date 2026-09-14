import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

export const config = {
    port: process.env.PORT || 3000,
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY?.trim(),
    grokApiKey: process.env.GROK_API_KEY?.trim(),
    grokBaseUrl: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
    grokModel: process.env.GROK_MODEL || 'grok-4.6',
    grokFallbackModel: process.env.GROK_FALLBACK_MODEL || 'grok-4.3',
};
