"use strict";
/**
 * Camarilla Pivot Point Calculations
 * Used for intraday trading support and resistance levels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCamarillaPivots = calculateCamarillaPivots;
exports.calculateVolatilityRange = calculateVolatilityRange;
exports.calculateVolatilityRanges = calculateVolatilityRanges;
exports.formatRangeDisplay = formatRangeDisplay;
/**
 * Calculate Camarilla Pivot Points
 * @param high - Previous session High
 * @param low - Previous session Low
 * @param close - Previous session Close
 * @returns Camarilla pivot levels
 */
function calculateCamarillaPivots(high, low, close) {
    const range = high - low;
    // Resistance Levels
    const H1 = close + ((high - close) * 1.1) / 12;
    const H2 = close + ((high - close) * 1.1) / 6;
    const H3 = close + (range * 1.1) / 4;
    const H4 = close + (range * 1.1) / 2;
    // Support Levels
    const L1 = close - ((close - low) * 1.1) / 12;
    const L2 = close - ((close - low) * 1.1) / 6;
    const L3 = close - (range * 1.1) / 4;
    const L4 = close - (range * 1.1) / 2;
    // Breakout Targets
    const B_O_up = H4 + (H4 - H3);
    const B_O_dn = L4 - (L3 - L4);
    return {
        H1,
        H2,
        H3,
        H4,
        L1,
        L2,
        L3,
        L4,
        B_O_up,
        B_O_dn,
        range,
    };
}
/**
 * Calculate volatility-based range for a given period
 * @param close - Current close price
 * @param volatility - Volatility percentage (e.g., 15 for 15%)
 * @param days - Number of days (1 = Daily, 5 = Weekly, 30 = Monthly)
 * @returns Range levels and targets
 */
function calculateVolatilityRange(close, volatility, days) {
    // Base formula: R = C × (V / 100) × √(D / 365)
    const factor = Math.sqrt(days / 365);
    const range = close * (volatility / 100) * factor;
    const upper = close + range;
    const lower = close - range;
    // Calculate targets (T1, T2, T3 are 1x, 2x, 3x the range)
    const T1_up = close + range;
    const T1_dn = close - range;
    const T2_up = close + 2 * range;
    const T2_dn = close - 2 * range;
    const T3_up = close + 3 * range;
    const T3_dn = close - 3 * range;
    return {
        upper,
        lower,
        T1_up,
        T1_dn,
        T2_up,
        T2_dn,
        T3_up,
        T3_dn,
        range,
    };
}
/**
 * Calculate all volatility ranges (Daily, Weekly, Monthly)
 * @param close - Current close price
 * @param volatility - Volatility percentage (from IVDEX/VIX)
 * @returns Daily, Weekly, and Monthly ranges with targets
 */
function calculateVolatilityRanges(close, volatility) {
    return {
        daily: calculateVolatilityRange(close, volatility, 1),
        weekly: calculateVolatilityRange(close, volatility, 5),
        monthly: calculateVolatilityRange(close, volatility, 30),
    };
}
/**
 * Format range display string
 * @param lower - Lower bound
 * @param upper - Upper bound
 * @returns Formatted string like "19500 - 19800"
 */
function formatRangeDisplay(lower, upper) {
    return `${lower.toFixed(2)} - ${upper.toFixed(2)}`;
}
//# sourceMappingURL=pivotCalculations.js.map