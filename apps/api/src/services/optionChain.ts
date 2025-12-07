import { OptionChain, OptionChainRow, OptionData, SummaryStats, BuiltUpType } from '@option-dashboard/shared';
import { calculatePCR, classifyBuiltUp, calculateCallGreeks, calculatePutGreeks } from '@option-dashboard/shared';

// Mock data cache
const mockCache: Map<string, OptionChain> = new Map();

/**
 * Get option chain for specified index and expiry
 */
export async function getOptionChain(index: string, expiry?: string): Promise<OptionChain> {
  const cacheKey = `${index}-${expiry || 'current'}`;
  
  // Return cached if available
  if (mockCache.has(cacheKey)) {
    return mockCache.get(cacheKey)!;
  }

  // Generate mock option chain
  const chain = generateMockOptionChain(index, expiry);
  mockCache.set(cacheKey, chain);
  
  return chain;
}

/**
 * Get summary statistics for option chain
 */
export async function getSummaryStats(index: string, expiry?: string): Promise<SummaryStats> {
  const chain = await getOptionChain(index, expiry);
  
  let volCE = 0, volPE = 0, callOI = 0, putOI = 0;
  let totalDelta = 0, totalGamma = 0, totalVega = 0, totalRho = 0, totalTheta = 0;
  
  chain.rows.forEach(row => {
    volCE += row.ce.volume;
    volPE += row.pe.volume;
    callOI += row.ce.oi;
    putOI += row.pe.oi;
    
    // Sum Greeks (simplified - in practice, would weight by position size)
    totalDelta += row.ce.delta + row.pe.delta;
    totalGamma += Math.abs(row.ce.delta - row.pe.delta) / 100; // Simplified gamma
  });
  
  const pcr = calculatePCR(putOI, callOI);
  
  return {
    volCE,
    volPE,
    totalVol: volCE + volPE,
    callOI,
    putOI,
    totalOI: callOI + putOI,
    pcr,
    alpha: 0.05, // Placeholder
    beta: 1.2,   // Placeholder
    gamma: totalGamma,
    delta: totalDelta,
    rho: totalRho,
  };
}

/**
 * Generate mock option chain data
 */
function generateMockOptionChain(index: string, expiry?: string): OptionChain {
  const spotPrices: Record<string, number> = {
    nifty50: 19650,
    banknifty: 44200,
    finnifty: 19800,
    midcapnifty: 9500,
    sensex: 65400,
    bankex: 52300,
  };
  
  const spot = spotPrices[index] || 19650;
  const strikeInterval = index === 'banknifty' || index === 'bankex' ? 100 : 50;
  
  // Generate 17 strikes around spot
  const centerStrike = Math.round(spot / strikeInterval) * strikeInterval;
  const strikes: number[] = [];
  
  for (let i = -8; i <= 8; i++) {
    strikes.push(centerStrike + i * strikeInterval);
  }
  
  const rows: OptionChainRow[] = strikes.map((strike, idx) => {
    const isSpotStrike = idx === 8;
    const distanceFromSpot = Math.abs(strike - spot);
    const isITM_CE = strike < spot;
    const isITM_PE = strike > spot;
    
    // Generate realistic option data
    const ce = generateOptionData(strike, spot, true, isITM_CE, distanceFromSpot);
    const pe = generateOptionData(strike, spot, false, isITM_PE, distanceFromSpot);
    
    const pcr = calculatePCR(pe.oi, ce.oi);
    
    return {
      strike,
      pcr,
      ce,
      pe,
      isSpotStrike,
    };
  });
  
  return {
    index: index as any,
    spot,
    expiry: expiry || getNextExpiry(),
    rows,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate realistic option data for a strike
 */
function generateOptionData(
  strike: number,
  spot: number,
  isCall: boolean,
  isITM: boolean,
  distance: number
): OptionData {
  const moneyness = distance / spot;
  
  // LTP decreases as you move away from spot
  const baseLTP = isITM ? distance + 50 : Math.max(5, 200 - distance * 0.1);
  const ltp = baseLTP + (Math.random() - 0.5) * 20;
  const ltpChg = (Math.random() - 0.5) * 10;
  const ltpChgPercent = (ltpChg / ltp) * 100;
  
  // OI and volume are higher near ATM
  const atmFactor = Math.exp(-moneyness * 10);
  const oi = Math.floor((50000 + Math.random() * 100000) * (1 + atmFactor));
  const oiChg = Math.floor((Math.random() - 0.5) * oi * 0.2);
  const oiChgPercent = (oiChg / oi) * 100;
  const volume = Math.floor((10000 + Math.random() * 50000) * (1 + atmFactor));
  
  // IV is higher for OTM options
  const iv = (15 + moneyness * 50 + (Math.random() - 0.5) * 5) / 100;
  
  // Time value
  const intrinsic = isCall ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  const tvItm = ltp - intrinsic;
  
  // Greeks (simplified)
  const delta = isCall
    ? isITM ? 0.7 + Math.random() * 0.2 : 0.1 + Math.random() * 0.3
    : isITM ? -(0.7 + Math.random() * 0.2) : -(0.1 + Math.random() * 0.3);
  
  // Built-up classification
  const builtUp = classifyBuiltUp(ltpChgPercent, oiChgPercent);
  
  return {
    strike,
    ltp: parseFloat(ltp.toFixed(2)),
    ltpChg: parseFloat(ltpChg.toFixed(2)),
    ltpChgPercent: parseFloat(ltpChgPercent.toFixed(2)),
    oi,
    oiChg,
    oiChgPercent: parseFloat(oiChgPercent.toFixed(2)),
    volume,
    iv: parseFloat((iv * 100).toFixed(2)),
    tvItm: parseFloat(tvItm.toFixed(2)),
    delta: parseFloat(delta.toFixed(3)),
    builtUp,
  };
}

/**
 * Get next expiry date (Thursday)
 */
function getNextExpiry(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  const nextThursday = new Date(today);
  nextThursday.setDate(today.getDate() + daysUntilThursday);
  return nextThursday.toISOString().split('T')[0];
}
