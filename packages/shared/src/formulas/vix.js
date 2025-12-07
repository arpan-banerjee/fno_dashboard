"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_FACTORS = void 0;
exports.calculateVixRange = calculateVixRange;
exports.calculateDailyRange = calculateDailyRange;
exports.calculateWeeklyRange = calculateWeeklyRange;
exports.calculateMonthlyRange = calculateMonthlyRange;
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
exports.TIME_FACTORS = {
    daily: 0.0523,
    weekly: 0.1171,
    monthly: 0.2867,
};
/**
 * Calculate VIX-based range
 *
 * @param currentPrice - Current spot price (C)
 * @param vix - VIX value (V)
 * @param timeFactor - sqrt(D/365), use TIME_FACTORS constants
 * @returns VixRange object with upper, lower, and target levels
 */
function calculateVixRange(currentPrice, vix, timeFactor) {
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
function calculateDailyRange(currentPrice, vix) {
    return calculateVixRange(currentPrice, vix, exports.TIME_FACTORS.daily);
}
/**
 * Calculate weekly range
 */
function calculateWeeklyRange(currentPrice, vix) {
    return calculateVixRange(currentPrice, vix, exports.TIME_FACTORS.weekly);
}
/**
 * Calculate monthly range
 */
function calculateMonthlyRange(currentPrice, vix) {
    return calculateVixRange(currentPrice, vix, exports.TIME_FACTORS.monthly);
}
//# sourceMappingURL=vix.js.map