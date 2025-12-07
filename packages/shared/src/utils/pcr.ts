/**
 * Calculate Put-Call Ratio (PCR)
 * 
 * PCR = Put OI / Call OI
 * 
 * Interpretation:
 * - PCR > 1: Bearish sentiment (more puts than calls)
 * - PCR < 1: Bullish sentiment (more calls than puts)
 * - PCR = 1: Neutral
 */

/**
 * Calculate global PCR from total OI
 */
export function calculatePCR(putOI: number, callOI: number): number {
  if (callOI === 0) {
    return putOI > 0 ? Infinity : 0;
  }
  return putOI / callOI;
}

/**
 * Calculate per-strike PCR
 */
export function calculateStrikePCR(peOI: number, ceOI: number): number {
  return calculatePCR(peOI, ceOI);
}

/**
 * Format PCR for display (handle infinity and precision)
 */
export function formatPCR(pcr: number, decimals: number = 2): string {
  if (!isFinite(pcr)) {
    return '∞';
  }
  if (pcr === 0) {
    return '0.00';
  }
  return pcr.toFixed(decimals);
}

/**
 * Get PCR interpretation
 */
export function interpretPCR(pcr: number): 'bullish' | 'neutral' | 'bearish' {
  if (pcr > 1.2) return 'bearish';
  if (pcr < 0.8) return 'bullish';
  return 'neutral';
}
