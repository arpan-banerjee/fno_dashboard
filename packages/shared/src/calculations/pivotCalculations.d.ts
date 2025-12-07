/**
 * Camarilla Pivot Point Calculations
 * Used for intraday trading support and resistance levels
 */
export interface CamarillaPivots {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    L1: number;
    L2: number;
    L3: number;
    L4: number;
    B_O_up: number;
    B_O_dn: number;
    range: number;
}
/**
 * Calculate Camarilla Pivot Points
 * @param high - Previous session High
 * @param low - Previous session Low
 * @param close - Previous session Close
 * @returns Camarilla pivot levels
 */
export declare function calculateCamarillaPivots(high: number, low: number, close: number): CamarillaPivots;
/**
 * Volatility-Based Range Calculations
 */
export interface RangeLevel {
    upper: number;
    lower: number;
    T1_up: number;
    T1_dn: number;
    T2_up: number;
    T2_dn: number;
    T3_up: number;
    T3_dn: number;
    range: number;
}
export interface VolatilityRanges {
    daily: RangeLevel;
    weekly: RangeLevel;
    monthly: RangeLevel;
}
/**
 * Calculate volatility-based range for a given period
 * @param close - Current close price
 * @param volatility - Volatility percentage (e.g., 15 for 15%)
 * @param days - Number of days (1 = Daily, 5 = Weekly, 30 = Monthly)
 * @returns Range levels and targets
 */
export declare function calculateVolatilityRange(close: number, volatility: number, days: number): RangeLevel;
/**
 * Calculate all volatility ranges (Daily, Weekly, Monthly)
 * @param close - Current close price
 * @param volatility - Volatility percentage (from IVDEX/VIX)
 * @returns Daily, Weekly, and Monthly ranges with targets
 */
export declare function calculateVolatilityRanges(close: number, volatility: number): VolatilityRanges;
/**
 * Format range display string
 * @param lower - Lower bound
 * @param upper - Upper bound
 * @returns Formatted string like "19500 - 19800"
 */
export declare function formatRangeDisplay(lower: number, upper: number): string;
