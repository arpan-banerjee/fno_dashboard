import { BuiltUpType } from '../types/market';
/**
 * Configuration for built-up classification
 */
export interface BuiltUpConfig {
    priceChangeThreshold: number;
    oiChangeThreshold: number;
}
/**
 * Classify option built-up based on price and OI changes
 *
 * Rules:
 * - Price ↑ & OI ↑ → Long Built Up
 * - Price ↑ & OI ↓ → Short Cover
 * - Price ↓ & OI ↑ → Short Built Up
 * - Price ↓ & OI ↓ → Long Unwind
 *
 * @param ltpChange - Change in Last Traded Price (percentage)
 * @param oiChange - Change in Open Interest (percentage)
 * @param config - Optional configuration for thresholds
 * @returns Built-up classification or null if insignificant changes
 */
export declare function classifyBuiltUp(ltpChange: number, oiChange: number, config?: BuiltUpConfig): BuiltUpType | null;
/**
 * Get color/style for built-up type (for UI rendering)
 */
export declare function getBuiltUpStyle(builtUp: BuiltUpType | null): {
    color: string;
    backgroundColor: string;
};
