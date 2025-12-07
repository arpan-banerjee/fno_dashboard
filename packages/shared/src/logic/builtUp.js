"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyBuiltUp = classifyBuiltUp;
exports.getBuiltUpStyle = getBuiltUpStyle;
const DEFAULT_CONFIG = {
    priceChangeThreshold: 0,
    oiChangeThreshold: 0,
};
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
function classifyBuiltUp(ltpChange, oiChange, config = DEFAULT_CONFIG) {
    const { priceChangeThreshold, oiChangeThreshold } = config;
    // Check if changes are significant enough
    const priceSignificant = Math.abs(ltpChange) >= priceChangeThreshold;
    const oiSignificant = Math.abs(oiChange) >= oiChangeThreshold;
    if (!priceSignificant && !oiSignificant) {
        return null;
    }
    const priceUp = ltpChange > 0;
    const oiUp = oiChange > 0;
    if (priceUp && oiUp) {
        return 'Long Built Up';
    }
    else if (priceUp && !oiUp) {
        return 'Short Cover';
    }
    else if (!priceUp && oiUp) {
        return 'Short Built Up';
    }
    else {
        return 'Long Unwind';
    }
}
/**
 * Get color/style for built-up type (for UI rendering)
 */
function getBuiltUpStyle(builtUp) {
    switch (builtUp) {
        case 'Long Built Up':
            return { color: '#fff', backgroundColor: '#2e7d32' }; // Dark green
        case 'Short Cover':
            return { color: '#000', backgroundColor: '#81c784' }; // Light green
        case 'Short Built Up':
            return { color: '#fff', backgroundColor: '#c62828' }; // Dark red
        case 'Long Unwind':
            return { color: '#000', backgroundColor: '#ef9a9a' }; // Light red
        default:
            return { color: '#000', backgroundColor: 'transparent' };
    }
}
//# sourceMappingURL=builtUp.js.map