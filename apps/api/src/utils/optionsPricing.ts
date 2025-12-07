/**
 * Options Pricing Calculations
 * Black-Scholes model for IV calculation and Greeks
 */

/**
 * Calculate Time Value (TV)
 * TV = Option Premium - Intrinsic Value
 */
export function calculateTimeValue(
  optionPremium: number,
  spotPrice: number,
  strikePrice: number,
  optionType: 'CE' | 'PE'
): number {
  let intrinsicValue = 0;

  if (optionType === 'CE') {
    // Call option: max(0, Spot - Strike)
    intrinsicValue = Math.max(0, spotPrice - strikePrice);
  } else {
    // Put option: max(0, Strike - Spot)
    intrinsicValue = Math.max(0, strikePrice - spotPrice);
  }

  const timeValue = Math.max(0, optionPremium - intrinsicValue);
  return parseFloat(timeValue.toFixed(2));
}

/**
 * Calculate time to expiry in years
 */
export function getTimeToExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  
  // Set expiry to 3:30 PM IST (market close)
  expiry.setHours(15, 30, 0, 0);
  
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  // Minimum 1 hour (to avoid division by zero)
  const minTimeInYears = 1 / (365 * 24);
  return Math.max(minTimeInYears, diffDays / 365);
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return x > 0 ? 1 - probability : probability;
}

/**
 * Black-Scholes option pricing formula
 */
export function blackScholes(
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  volatility: number,
  riskFreeRate: number,
  optionType: 'call' | 'put'
): number {
  const d1 =
    (Math.log(spotPrice / strikePrice) +
      (riskFreeRate + (volatility * volatility) / 2) * timeToExpiry) /
    (volatility * Math.sqrt(timeToExpiry));
  
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

  if (optionType === 'call') {
    return (
      spotPrice * normalCDF(d1) -
      strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2)
    );
  } else {
    return (
      strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) -
      spotPrice * normalCDF(-d1)
    );
  }
}

/**
 * Calculate Implied Volatility using Newton-Raphson method
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  optionType: 'call' | 'put'
): number {
  // Initial guess for volatility
  let volatility = 0.3; // 30%
  
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    const price = blackScholes(
      spotPrice,
      strikePrice,
      timeToExpiry,
      volatility,
      riskFreeRate,
      optionType
    );

    const diff = marketPrice - price;

    if (Math.abs(diff) < tolerance) {
      return parseFloat((volatility * 100).toFixed(2)); // Return as percentage
    }

    // Calculate vega (derivative of price with respect to volatility)
    const d1 =
      (Math.log(spotPrice / strikePrice) +
        (riskFreeRate + (volatility * volatility) / 2) * timeToExpiry) /
      (volatility * Math.sqrt(timeToExpiry));
    
    const vega = spotPrice * normalCDF(d1) * Math.sqrt(timeToExpiry);

    if (vega < 0.0001) {
      break; // Avoid division by zero
    }

    // Newton-Raphson update
    volatility = volatility + diff / (vega * 100);

    // Keep volatility in reasonable range
    volatility = Math.max(0.01, Math.min(volatility, 5.0));
  }

  // If convergence failed, return a reasonable default
  return parseFloat((volatility * 100).toFixed(2));
}

/**
 * Calculate average IV for an option chain
 */
export function calculateAverageIV(
  options: Array<{
    ltp: number;
    strike: number;
    type: 'call' | 'put';
  }>,
  spotPrice: number,
  timeToExpiry: number,
  riskFreeRate: number = 0.065 // 6.5% for India
): number {
  if (options.length === 0) {
    return 0;
  }

  const ivValues = options
    .filter(opt => opt.ltp > 0) // Only consider options with valid prices
    .map(opt =>
      calculateImpliedVolatility(
        opt.ltp,
        spotPrice,
        opt.strike,
        timeToExpiry,
        riskFreeRate,
        opt.type
      )
    );

  if (ivValues.length === 0) {
    return 0;
  }

  const averageIV = ivValues.reduce((sum, iv) => sum + iv, 0) / ivValues.length;
  return parseFloat(averageIV.toFixed(2));
}

/**
 * Calculate Greeks - Delta
 */
export function calculateDelta(
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  volatility: number,
  riskFreeRate: number,
  optionType: 'call' | 'put'
): number {
  const d1 =
    (Math.log(spotPrice / strikePrice) +
      (riskFreeRate + (volatility * volatility) / 2) * timeToExpiry) /
    (volatility * Math.sqrt(timeToExpiry));

  if (optionType === 'call') {
    return normalCDF(d1);
  } else {
    return normalCDF(d1) - 1;
  }
}
