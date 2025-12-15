/**
 * Currency utility functions
 *
 * Exchange rate: 1 KRW = 18 VND
 * Prices in database are stored in VND
 * Display prices in KRW
 */

const VND_TO_KRW_RATE = 18;

/**
 * Format price in KRW (convert from VND)
 * @param priceInVND Price in Vietnamese Dong
 * @returns Formatted price string with KRW unit
 */
export function formatPriceKRW(priceInVND: number | null | undefined): string {
  if (priceInVND === null || priceInVND === undefined || isNaN(priceInVND)) {
    return "0 KRW";
  }

  const priceInKRW = Math.round(priceInVND / VND_TO_KRW_RATE);
  return `${priceInKRW.toLocaleString()} KRW`;
}

/**
 * Format price in KRW without unit (convert from VND)
 * @param priceInVND Price in Vietnamese Dong
 * @returns Formatted price number string
 */
export function formatPriceKRWNumber(
  priceInVND: number | null | undefined
): string {
  if (priceInVND === null || priceInVND === undefined || isNaN(priceInVND)) {
    return "0";
  }

  const priceInKRW = Math.round(priceInVND / VND_TO_KRW_RATE);
  return priceInKRW.toLocaleString();
}

/**
 * Convert VND to KRW
 * @param vnd Price in Vietnamese Dong
 * @returns Price in Korean Won
 */
export function vndToKrw(vnd: number): number {
  return Math.round(vnd / VND_TO_KRW_RATE);
}

/**
 * Convert KRW to VND
 * @param krw Price in Korean Won
 * @returns Price in Vietnamese Dong
 */
export function krwToVnd(krw: number): number {
  return Math.round(krw * VND_TO_KRW_RATE);
}
