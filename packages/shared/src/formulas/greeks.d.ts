import { Greeks } from '../types/market';
/**
 * Calculate Greeks for a Call option
 */
export declare function calculateCallGreeks(spotPrice: number, strikePrice: number, riskFreeRate: number, volatility: number, timeToExpiry: number): Greeks;
/**
 * Calculate Greeks for a Put option
 */
export declare function calculatePutGreeks(spotPrice: number, strikePrice: number, riskFreeRate: number, volatility: number, timeToExpiry: number): Greeks;
/**
 * Calculate deep ITM approximation for Call
 */
export declare function deepITMCallApprox(spotPrice: number, strikePrice: number, riskFreeRate: number, timeToExpiry: number): number;
/**
 * Calculate deep ITM approximation for Put
 */
export declare function deepITMPutApprox(spotPrice: number, strikePrice: number, riskFreeRate: number, timeToExpiry: number): number;
/**
 * Calculate time value (ITM/OTM)
 */
export declare function calculateTimeValue(ltp: number, spotPrice: number, strikePrice: number, isCall: boolean): number;
