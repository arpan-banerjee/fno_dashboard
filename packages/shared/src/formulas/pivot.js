"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateClassicPivot = calculateClassicPivot;
exports.calculateFibonacciPivot = calculateFibonacciPivot;
exports.calculateCamarillaPivot = calculateCamarillaPivot;
exports.calculatePivot = calculatePivot;
/**
 * Calculate Classic Pivot Points
 *
 * Pivot = (H + L + C) / 3
 * R1 = 2 × Pivot - L
 * S1 = 2 × Pivot - H
 * R2 = Pivot + (H - L)
 * S2 = Pivot - (H - L)
 */
function calculateClassicPivot(ohlc) {
    const { high, low, close } = ohlc;
    const pivot = (high + low + close) / 3;
    const range = high - low;
    return {
        pivot,
        r1: 2 * pivot - low,
        r2: pivot + range,
        s1: 2 * pivot - high,
        s2: pivot - range,
    };
}
/**
 * Calculate Fibonacci Pivot Points
 *
 * Pivot = (H + L + C) / 3
 * R1 = Pivot + 0.382 × (H - L)
 * R2 = Pivot + 0.618 × (H - L)
 * S1 = Pivot - 0.382 × (H - L)
 * S2 = Pivot - 0.618 × (H - L)
 */
function calculateFibonacciPivot(ohlc) {
    const { high, low, close } = ohlc;
    const pivot = (high + low + close) / 3;
    const range = high - low;
    return {
        pivot,
        r1: pivot + 0.382 * range,
        r2: pivot + 0.618 * range,
        s1: pivot - 0.382 * range,
        s2: pivot - 0.618 * range,
    };
}
/**
 * Calculate Camarilla Pivot Points
 *
 * Pivot = (H + L + C) / 3
 * R1 = C + 1.1 × (H - L) / 12
 * R2 = C + 1.1 × (H - L) / 6
 * S1 = C - 1.1 × (H - L) / 12
 * S2 = C - 1.1 × (H - L) / 6
 */
function calculateCamarillaPivot(ohlc) {
    const { high, low, close } = ohlc;
    const pivot = (high + low + close) / 3;
    const range = high - low;
    const factor = 1.1 * range;
    return {
        pivot,
        r1: close + factor / 12,
        r2: close + factor / 6,
        s1: close - factor / 12,
        s2: close - factor / 6,
    };
}
/**
 * Calculate pivot points based on specified method
 */
function calculatePivot(ohlc, method = 'classic') {
    switch (method) {
        case 'fibonacci':
            return calculateFibonacciPivot(ohlc);
        case 'camarilla':
            return calculateCamarillaPivot(ohlc);
        case 'classic':
        default:
            return calculateClassicPivot(ohlc);
    }
}
//# sourceMappingURL=pivot.js.map