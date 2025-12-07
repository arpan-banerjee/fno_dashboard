/**
 * Option Chain Utility Functions
 * Built-up classification, color logic, ATM detection
 */

export interface StrikeData {
  strikePrice: number;
  ceOI: number;
  ceOIChange: number;
  ceVolume: number;
  ceLTP?: number;
  ceBidPrice?: number;
  ceBidQty?: number;
  ceAskPrice?: number;
  ceAskQty?: number;
  peOI: number;
  peOIChange: number;
  peVolume: number;
  peLTP?: number;
  peBidPrice?: number;
  peBidQty?: number;
  peAskPrice?: number;
  peAskQty?: number;
}

export interface BuiltUpResult {
  classification: 'LB' | 'SB' | 'LU' | 'SC';
  color: string;
}

export interface ColorFlags {
  ceVolumeColor: string;
  peVolumeColor: string;
  ceOIColor: string;
  peOIColor: string;
  ceShouldFadeOI: boolean;
  peShouldFadeOI: boolean;
}

/**
 * Calculate Built-up Classification
 * LB (Long Build-up): OI increasing, Price increasing → Green
 * SB (Short Build-up): OI increasing, Price decreasing → Red
 * LU (Long Unwinding): OI decreasing, Price decreasing → Orange
 * SC (Short Covering): OI decreasing, Price increasing → Light Green
 */
export function calculateBuiltUp(
  oiChange: number,
  priceChange: number
): BuiltUpResult {
  if (oiChange > 0 && priceChange > 0) {
    return { classification: 'LB', color: '#4caf50' }; // Green
  } else if (oiChange > 0 && priceChange < 0) {
    return { classification: 'SB', color: '#f44336' }; // Red
  } else if (oiChange < 0 && priceChange < 0) {
    return { classification: 'LU', color: '#ff9800' }; // Orange
  } else if (oiChange < 0 && priceChange > 0) {
    return { classification: 'SC', color: '#c8e6c9' }; // Light Green
  } else {
    return { classification: 'LB', color: '#ffffff' }; // Neutral
  }
}

/**
 * Find ATM (At-The-Money) strike
 * ATM is the strike price closest to the current spot price
 */
export function findATMStrike(
  strikes: StrikeData[],
  spotPrice: number
): number {
  let atmStrike = strikes[0]?.strikePrice || 0;
  let minDiff = Math.abs(strikes[0]?.strikePrice - spotPrice);

  strikes.forEach((strike) => {
    const diff = Math.abs(strike.strikePrice - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmStrike = strike.strikePrice;
    }
  });

  return atmStrike;
}

/**
 * Filter strikes to ATM ± 15 strikes
 */
export function filterStrikeRange(
  strikes: StrikeData[],
  spotPrice: number
): StrikeData[] {
  const atmStrike = findATMStrike(strikes, spotPrice);
  const atmIndex = strikes.findIndex((s) => s.strikePrice === atmStrike);

  if (atmIndex === -1) {
    return strikes.slice(0, 31); // Fallback to first 31 strikes
  }

  const start = Math.max(0, atmIndex - 15);
  const end = Math.min(strikes.length, atmIndex + 16); // +16 to include ATM

  return strikes.slice(start, end);
}

/**
 * Find highest CE and PE volumes
 */
export function findHighestVolumes(strikes: StrikeData[]): {
  highestCEVolume: number;
  highestPEVolume: number;
} {
  let highestCEVolume = 0;
  let highestPEVolume = 0;

  strikes.forEach((strike) => {
    if (strike.ceVolume > highestCEVolume) {
      highestCEVolume = strike.ceVolume;
    }
    if (strike.peVolume > highestPEVolume) {
      highestPEVolume = strike.peVolume;
    }
  });

  return { highestCEVolume, highestPEVolume };
}

/**
 * Find highest CE and PE OI
 */
export function findHighestOI(strikes: StrikeData[]): {
  highestCEOI: number;
  highestPEOI: number;
} {
  let highestCEOI = 0;
  let highestPEOI = 0;

  strikes.forEach((strike) => {
    if (strike.ceOI > highestCEOI) {
      highestCEOI = strike.ceOI;
    }
    if (strike.peOI > highestPEOI) {
      highestPEOI = strike.peOI;
    }
  });

  return { highestCEOI, highestPEOI };
}

/**
 * Calculate volume color based on advanced logic
 */
export function calculateVolumeColor(
  volume: number,
  previousVolume: number,
  highestVolume: number,
  isCE: boolean
): string {
  const isHighest = volume === highestVolume && highestVolume > 0;
  const threshold = 0.7; // 70%
  const isRising =
    previousVolume > 0 && (volume - previousVolume) / previousVolume >= threshold;

  if (isHighest) {
    return isCE ? '#4caf50' : '#f44336'; // Green for CE, Red for PE
  } else if (isRising) {
    return isCE ? '#c8e6c9' : '#ffcdd2'; // Light Green for CE, Pink for PE
  }

  return 'transparent';
}

/**
 * Calculate OI color and fade flag based on advanced logic
 */
export function calculateOIColor(
  oi: number,
  previousOI: number,
  highestOI: number,
  isCE: boolean
): { color: string; shouldFade: boolean } {
  const isHighest = oi === highestOI && highestOI > 0;
  const threshold = 0.6; // 60%

  if (previousOI === 0) {
    // No historical data
    if (isHighest) {
      return {
        color: isCE ? '#4caf50' : '#f44336',
        shouldFade: false,
      };
    }
    return { color: 'transparent', shouldFade: false };
  }

  const changePercent = (oi - previousOI) / previousOI;
  const isIncreasing = changePercent >= threshold;
  const isDecreasing = changePercent <= -threshold;

  if (isHighest) {
    return {
      color: isCE ? '#4caf50' : '#f44336', // Green for CE, Red for PE
      shouldFade: false,
    };
  } else if (isIncreasing) {
    return {
      color: isCE ? '#c8e6c9' : '#f8bbd0', // Light Green for CE, Light Pink for PE
      shouldFade: false,
    };
  } else if (isDecreasing) {
    return {
      color: '#ffeb3b', // Yellow
      shouldFade: true, // Trigger fade animation
    };
  }

  return { color: 'transparent', shouldFade: false };
}

/**
 * Calculate PCR (Put-Call Ratio)
 * PCR = Total PE OI / Total CE OI
 */
export function calculatePCR(strikes: StrikeData[]): number {
  let totalCEOI = 0;
  let totalPEOI = 0;

  strikes.forEach((strike) => {
    totalCEOI += strike.ceOI;
    totalPEOI += strike.peOI;
  });

  if (totalCEOI === 0) {
    return 0;
  }

  return parseFloat((totalPEOI / totalCEOI).toFixed(2));
}
