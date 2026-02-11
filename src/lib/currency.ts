// PHP to USD conversion
// Based on fixed rate: $5 ≈ ₱280 → 1 USD = ₱56
const PHP_TO_USD_RATE = 56;

export function phpToUsd(php: number): number {
  return php / PHP_TO_USD_RATE;
}

export function formatDualPrice(php: number): string {
  const usd = phpToUsd(php);
  return `₱${php.toFixed(2)} (~$${usd.toFixed(2)})`;
}
