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
export const TIME_FACTORS = {
  daily: 0.0523,
  weekly: 0.1171,
  monthly: 0.2867,
} as const;

/**
 * Calculate VIX-based range
 * 
 * @param currentPrice - Current spot price (C)
 * @param vix - VIX value (V)
 * @param timeFactor - sqrt(D/365), use TIME_FACTORS constants
 * @returns VixRange object with upper, lower, and target levels
 */
export function calculateVixRange(
  currentPrice: number,
  vix: number,
  timeFactor: number
): VixRange {
  const v = vix / 100;
  const R = currentPrice * v * timeFactor;
  
  return {
    upper: currentPrice + R,
    lower: currentPrice - R,
    upsideTarget: currentPrice + 3 * R,
    downsideTarget: currentPrice - 3 * R,
    rangeValue: R,
  };
}

/**
 * Calculate daily range
 */
export function calculateDailyRange(currentPrice: number, vix: number): VixRange {
  return calculateVixRange(currentPrice, vix, TIME_FACTORS.daily);
}

/**
 * Calculate weekly range
 */
export function calculateWeeklyRange(currentPrice: number, vix: number): VixRange {
  return calculateVixRange(currentPrice, vix, TIME_FACTORS.weekly);
}

/**
 * Calculate monthly range
 */
export function calculateMonthlyRange(currentPrice: number, vix: number): VixRange {
  return calculateVixRange(currentPrice, vix, TIME_FACTORS.monthly);
}
