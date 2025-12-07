import { PivotLevels } from '../types/market';
/**
 * Pivot calculation methods
 */
export type PivotMethod = 'classic' | 'fibonacci' | 'camarilla';
/**
 * OHLC data for pivot calculation
 */
export interface OHLCData {
    high: number;
    low: number;
    close: number;
}
/**
 * Calculate Classic Pivot Points
 *
 * Pivot = (H + L + C) / 3
 * R1 = 2 × Pivot - L
 * S1 = 2 × Pivot - H
 * R2 = Pivot + (H - L)
 * S2 = Pivot - (H - L)
 */
export declare function calculateClassicPivot(ohlc: OHLCData): PivotLevels;
/**
 * Calculate Fibonacci Pivot Points
 *
 * Pivot = (H + L + C) / 3
 * R1 = Pivot + 0.382 × (H - L)
 * R2 = Pivot + 0.618 × (H - L)
 * S1 = Pivot - 0.382 × (H - L)
 * S2 = Pivot - 0.618 × (H - L)
 */
export declare function calculateFibonacciPivot(ohlc: OHLCData): PivotLevels;
/**
 * Calculate Camarilla Pivot Points
 *
 * Pivot = (H + L + C) / 3
 * R1 = C + 1.1 × (H - L) / 12
 * R2 = C + 1.1 × (H - L) / 6
 * S1 = C - 1.1 × (H - L) / 12
 * S2 = C - 1.1 × (H - L) / 6
 */
export declare function calculateCamarillaPivot(ohlc: OHLCData): PivotLevels;
/**
 * Calculate pivot points based on specified method
 */
export declare function calculatePivot(ohlc: OHLCData, method?: PivotMethod): PivotLevels;
