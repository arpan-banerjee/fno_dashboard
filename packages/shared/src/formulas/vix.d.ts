import { VixRange } from '../types/market';
/**
 * VIX-Based Market Range Calculator
 *
 * Formula:
 * v = V/100 (VIX as decimal)
 * t = sqrt(D/365) (time factor)
 * R = C × v × t (range)
 *
 * Upper = C + R
 * Lower = C - R
 * Upside Target = C + 3R
 * Downside Target = C - 3R
 *
 * Practical sqrt(D/365) values:
 * - Daily (D=1): 0.0523
 * - Weekly (D=7): 0.1171
 * - Monthly (D=30): 0.2867
 */
/**
 * Time factors (sqrt(D/365))
 */
export declare const TIME_FACTORS: {
    readonly daily: 0.0523;
    readonly weekly: 0.1171;
    readonly monthly: 0.2867;
};
/**
 * Calculate VIX-based range
 *
 * @param currentPrice - Current spot price (C)
 * @param vix - VIX value (V)
 * @param timeFactor - sqrt(D/365), use TIME_FACTORS constants
 * @returns VixRange object with upper, lower, and target levels
 */
export declare function calculateVixRange(currentPrice: number, vix: number, timeFactor: number): VixRange;
/**
 * Calculate daily range
 */
export declare function calculateDailyRange(currentPrice: number, vix: number): VixRange;
/**
 * Calculate weekly range
 */
export declare function calculateWeeklyRange(currentPrice: number, vix: number): VixRange;
/**
 * Calculate monthly range
 */
export declare function calculateMonthlyRange(currentPrice: number, vix: number): VixRange;
