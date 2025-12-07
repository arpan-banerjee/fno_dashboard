/**
 * Option type (Call or Put)
 */
export type OptionType = 'CE' | 'PE';
/**
 * Built-up classification
 */
export type BuiltUpType = 'Long Built Up' | 'Short Cover' | 'Long Unwind' | 'Short Built Up';
/**
 * Index/instrument name
 */
export type IndexName = 'nifty50' | 'banknifty' | 'finnifty' | 'midcapnifty' | 'sensex' | 'bankex';
/**
 * Time frequency for pivot calculations
 */
export type Frequency = '1m' | '3m' | '5m' | '10m' | '15m' | '30m' | '1hr';
/**
 * Market mood
 */
export interface MarketMood {
    bull: number;
    neutral: number;
    bear: number;
}
/**
 * Option Greeks
 */
export interface Greeks {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
}
/**
 * Option data for a single strike (CE or PE side)
 */
export interface OptionData {
    strike: number;
    ltp: number;
    ltpChg: number;
    ltpChgPercent: number;
    oi: number;
    oiChg: number;
    oiChgPercent: number;
    volume: number;
    iv: number;
    tvItm: number;
    delta: number;
    builtUp: BuiltUpType | null;
}
/**
 * Complete option chain row (single strike, both CE and PE)
 */
export interface OptionChainRow {
    strike: number;
    pcr: number;
    ce: OptionData;
    pe: OptionData;
    isSpotStrike: boolean;
}
/**
 * Complete option chain
 */
export interface OptionChain {
    index: IndexName;
    spot: number;
    expiry: string;
    rows: OptionChainRow[];
    timestamp: string;
}
/**
 * Pivot levels
 */
export interface PivotLevels {
    pivot: number;
    r1: number;
    r2: number;
    s1: number;
    s2: number;
}
/**
 * Summary statistics
 */
export interface SummaryStats {
    volCE: number;
    volPE: number;
    totalVol: number;
    callOI: number;
    putOI: number;
    totalOI: number;
    pcr: number;
    alpha: number;
    beta: number;
    gamma: number;
    delta: number;
    rho: number;
}
/**
 * Target levels (bullish/bearish)
 */
export interface TargetLevels {
    first: number;
    second: number;
    third: number;
}
/**
 * Targets for all timeframes
 */
export interface Targets {
    daily: {
        bullish: TargetLevels;
        bearish: TargetLevels;
    };
    weekly: {
        bullish: TargetLevels;
        bearish: TargetLevels;
    };
    monthly: {
        bullish: TargetLevels;
        bearish: TargetLevels;
    };
}
/**
 * VIX-based range calculation
 */
export interface VixRange {
    upper: number;
    lower: number;
    upsideTarget: number;
    downsideTarget: number;
    rangeValue: number;
}
/**
 * Index info for tab
 */
export interface IndexInfo {
    label: string;
    name: IndexName | 'fno' | 'iv' | 'monthly_range' | 'weekly_range' | 'daily_range';
    spot?: number;
    hasDropdown: boolean;
    expiries?: string[];
}
/**
 * Streaming tick data
 */
export interface TickData {
    symbol: string;
    ltp: number;
    volume: number;
    oi?: number;
    timestamp: string;
}
/**
 * OI Spurt alert
 */
export interface OISpurt {
    strike: number;
    optionType: OptionType;
    oiChgPercent: number;
    timestamp: string;
}
