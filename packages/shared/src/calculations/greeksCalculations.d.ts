/**
 * Options Greeks Calculations
 * Alpha, Beta, Vega using Black-Scholes model
 */
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
export declare function calculateVega(spot: number, strike: number, timeToExpiry: number, volatility: number, riskFreeRate?: number): number;
/**
 * Calculate Alpha
 * Alpha = Vega / 100
 *
 * @param vega - Vega value
 * @returns Alpha value
 */
export declare function calculateAlpha(vega: number): number;
/**
 * Calculate Beta
 * Beta = Delta × (S / Option_Price)
 *
 * @param delta - Option delta
 * @param spot - Current spot price
 * @param optionPrice - Option LTP
 * @returns Beta value
 */
export declare function calculateBeta(delta: number, spot: number, optionPrice: number): number;
/**
 * Calculate time to expiry in years
 * @param expiryDate - Expiry date string (YYYY-MM-DD)
 * @returns Time to expiry in years
 */
export declare function calculateTimeToExpiry(expiryDate: string): number;
/**
 * Calculate aggregate Vega for entire option chain
 * Uses ATM strike as representative strike
 * @param spot - Current spot price
 * @param expiryDate - Expiry date
 * @param volatility - Current volatility
 * @returns Aggregate Vega
 */
export declare function calculateAggregateVega(spot: number, expiryDate: string, volatility: number): number;
/**
 * Calculate weighted average Delta from option chain
 * @param options - Array of options with delta and open interest
 * @returns Weighted average delta
 */
export declare function calculateWeightedDelta(options: Array<{
    delta: number;
    openInterest: number;
}>): number;
