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
export declare function calculatePCR(putOI: number, callOI: number): number;
/**
 * Calculate per-strike PCR
 */
export declare function calculateStrikePCR(peOI: number, ceOI: number): number;
/**
 * Format PCR for display (handle infinity and precision)
 */
export declare function formatPCR(pcr: number, decimals?: number): string;
/**
 * Get PCR interpretation
 */
export declare function interpretPCR(pcr: number): 'bullish' | 'neutral' | 'bearish';
