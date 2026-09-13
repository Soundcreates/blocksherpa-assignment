/**
 * Format price in US Dollars (USD)
 *
 * @param price - Price in USD (number)
 * @returns Formatted price string (e.g., "$2.50M", "$75.0K", "$50,000")
 *
 * @example
 * formatPriceUSD(2500000)   // "$2.50M"
 * formatPriceUSD(75000)     // "$75.0K"
 * formatPriceUSD(50000)     // "$50,000"
 */
export function formatPriceUSD(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(2)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(1)}K`;
  }
  return `$${price.toLocaleString('en-US')}`;
}