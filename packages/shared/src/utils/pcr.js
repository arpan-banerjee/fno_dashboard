"use strict";
/**
 * Calculate Put-Call Ratio (PCR)
 *
 * PCR = Put OI / Call OI
 *
 * Interpretation:
 * - PCR > 1: Bearish sentiment (more puts than calls)
 * - PCR < 1: Bullish sentiment (more calls than puts)
 * - PCR = 1: Neutral
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePCR = calculatePCR;
exports.calculateStrikePCR = calculateStrikePCR;
exports.formatPCR = formatPCR;
exports.interpretPCR = interpretPCR;
/**
 * Calculate global PCR from total OI
 */
function calculatePCR(putOI, callOI) {
    if (callOI === 0) {
        return putOI > 0 ? Infinity : 0;
    }
    return putOI / callOI;
}
/**
 * Calculate per-strike PCR
 */
function calculateStrikePCR(peOI, ceOI) {
    return calculatePCR(peOI, ceOI);
}
/**
 * Format PCR for display (handle infinity and precision)
 */
function formatPCR(pcr, decimals = 2) {
    if (!isFinite(pcr)) {
        return '∞';
    }
    if (pcr === 0) {
        return '0.00';
    }
    return pcr.toFixed(decimals);
}
/**
 * Get PCR interpretation
 */
function interpretPCR(pcr) {
    if (pcr > 1.2)
        return 'bearish';
    if (pcr < 0.8)
        return 'bullish';
    return 'neutral';
}
//# sourceMappingURL=pcr.js.map