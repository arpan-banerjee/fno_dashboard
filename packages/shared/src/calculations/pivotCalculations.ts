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
  B_O_up: number;  // Upside Breakout
  B_O_dn: number;  // Downside Breakout
  range: number;   // H - L
}

/**
 * Calculate Camarilla Pivot Points
 * @param high - Previous session High
 * @param low - Previous session Low
 * @param close - Previous session Close
 * @returns Camarilla pivot levels
 */
export function calculateCamarillaPivots(
  high: number,
  low: number,
  close: number
): CamarillaPivots {
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
export function calculateVolatilityRange(
  close: number,
  volatility: number,
  days: number
): RangeLevel {
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
export function calculateVolatilityRanges(
  close: number,
  volatility: number
): VolatilityRanges {
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
export function formatRangeDisplay(lower: number, upper: number): string {
  return `${lower.toFixed(2)} - ${upper.toFixed(2)}`;
}
