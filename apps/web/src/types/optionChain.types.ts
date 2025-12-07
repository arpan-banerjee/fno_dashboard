/**
 * Option Chain TypeScript Interfaces
 */

export interface IVDEXData {
  symbol: string;
  currentIV: number;
  previousIV: number;
  ivChange: number;
  trend: '▲' | '▼' | '→';
  trendColor: string;
  timestamp: number;
}

export interface OptionStrike {
  strikePrice: number;
  isATM: boolean;

  // CE (Call) data
  ceVolume: number;
  ceVolumeColor: string;
  ceOI: number;
  ceOIChange: number;
  ceOIColor: string;
  ceShouldFadeOI: boolean;
  ceLTP: number;
  ceLTPChange: number;
  ceTV?: number; // Time Value
  ceIV?: number; // Implied Volatility
  ceBidPrice?: number;
  ceBidQty?: number;
  ceAskPrice?: number;
  ceAskQty?: number;
  ceBuiltUp: 'LB' | 'SB' | 'LU' | 'SC';
  ceBuiltUpColor: string;

  // PE (Put) data
  peVolume: number;
  peVolumeColor: string;
  peOI: number;
  peOIChange: number;
  peOIColor: string;
  peShouldFadeOI: boolean;
  peLTP: number;
  peLTPChange: number;
  peTV?: number; // Time Value
  peIV?: number; // Implied Volatility
  peBidPrice?: number;
  peBidQty?: number;
  peAskPrice?: number;
  peAskQty?: number;
  peBuiltUp: 'LB' | 'SB' | 'LU' | 'SC';
  peBuiltUpColor: string;
}

export interface OptionChainData {
  symbol: string;
  expiry: string;
  spotPrice: number;
  atmStrike: number;
  pcr: number;
  strikes: OptionStrike[];
  timestamp: number;
}
