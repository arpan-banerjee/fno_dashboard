"use strict";
/**
 * Options Greeks Calculations
 * Alpha, Beta, Vega using Black-Scholes model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVega = calculateVega;
exports.calculateAlpha = calculateAlpha;
exports.calculateBeta = calculateBeta;
exports.calculateTimeToExpiry = calculateTimeToExpiry;
exports.calculateAggregateVega = calculateAggregateVega;
exports.calculateWeightedDelta = calculateWeightedDelta;
/**
 * Standard normal probability density function
 * n(x) = (1/√(2π)) × e^(-x²/2)
 */
function normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
/**
 * Calculate d1 for Black-Scholes formula
 * d1 = [ln(S/K) + (r + σ²/2) × T] / (σ × √T)
 */
function calculateD1(spot, strike, timeToExpiry, volatility, riskFreeRate = 0.07 // 7% default for India
) {
    const vol = volatility / 100; // Convert percentage to decimal
    const numerator = Math.log(spot / strike) +
        (riskFreeRate + (vol * vol) / 2) * timeToExpiry;
    const denominator = vol * Math.sqrt(timeToExpiry);
    return numerator / denominator;
}
/**
 * Calculate Vega for an option
 * Vega = S × n(d1) × √T
 *
 * @param spot - Current spot price
 * @param strike - Strike price
 * @param timeToExpiry - Time to expiry in years
 * @param volatility - Volatility percentage (e.g., 15 for 15%)
 * @param riskFreeRate - Risk-free rate (default 7% for India)
 * @returns Vega value
 */
function calculateVega(spot, strike, timeToExpiry, volatility, riskFreeRate = 0.07) {
    const d1 = calculateD1(spot, strike, timeToExpiry, volatility, riskFreeRate);
    const vega = spot * normalPDF(d1) * Math.sqrt(timeToExpiry);
    return vega;
}
/**
 * Calculate Alpha
 * Alpha = Vega / 100
 *
 * @param vega - Vega value
 * @returns Alpha value
 */
function calculateAlpha(vega) {
    return vega / 100;
}
/**
 * Calculate Beta
 * Beta = Delta × (S / Option_Price)
 *
 * @param delta - Option delta
 * @param spot - Current spot price
 * @param optionPrice - Option LTP
 * @returns Beta value
 */
function calculateBeta(delta, spot, optionPrice) {
    if (optionPrice === 0)
        return 0;
    return delta * (spot / optionPrice);
}
/**
 * Calculate time to expiry in years
 * @param expiryDate - Expiry date string (YYYY-MM-DD)
 * @returns Time to expiry in years
 */
function calculateTimeToExpiry(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays / 365;
}
/**
 * Calculate aggregate Vega for entire option chain
 * Uses ATM strike as representative strike
 * @param spot - Current spot price
 * @param expiryDate - Expiry date
 * @param volatility - Current volatility
 * @returns Aggregate Vega
 */
function calculateAggregateVega(spot, expiryDate, volatility) {
    const timeToExpiry = calculateTimeToExpiry(expiryDate);
    // Use ATM strike (rounded to nearest 50)
    const atmStrike = Math.round(spot / 50) * 50;
    return calculateVega(spot, atmStrike, timeToExpiry, volatility);
}
/**
 * Calculate weighted average Delta from option chain
 * @param options - Array of options with delta and open interest
 * @returns Weighted average delta
 */
function calculateWeightedDelta(options) {
    let totalWeightedDelta = 0;
    let totalOI = 0;
    options.forEach((option) => {
        totalWeightedDelta += option.delta * option.openInterest;
        totalOI += option.openInterest;
    });
    return totalOI > 0 ? totalWeightedDelta / totalOI : 0;
}
//# sourceMappingURL=greeksCalculations.js.map