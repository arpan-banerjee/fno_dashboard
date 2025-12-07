"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCallGreeks = calculateCallGreeks;
exports.calculatePutGreeks = calculatePutGreeks;
exports.deepITMCallApprox = deepITMCallApprox;
exports.deepITMPutApprox = deepITMPutApprox;
exports.calculateTimeValue = calculateTimeValue;
/**
 * Black-Scholes Greeks Calculator
 *
 * Formulas:
 * d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
 * d2 = d1 - σ√T
 *
 * Delta:
 *   Call: N(d1)
 *   Put: N(d1) - 1
 *
 * Gamma: N'(d1) / (S σ √T)
 *
 * Theta:
 *   Call: -(S N'(d1) σ)/(2√T) - r K e^(-rT) N(d2)
 *   Put: -(S N'(d1) σ)/(2√T) + r K e^(-rT) N(-d2)
 *
 * Vega: S N'(d1) √T
 *
 * Rho:
 *   Call: K T e^(-rT) N(d2)
 *   Put: -K T e^(-rT) N(-d2)
 *
 * Where:
 * S = spot price
 * K = strike price
 * r = risk-free rate
 * σ = volatility (IV)
 * T = time to expiry (years)
 * N(x) = cumulative standard normal distribution
 * N'(x) = standard normal probability density function
 */
/**
 * Standard normal cumulative distribution function (approximation)
 */
function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
}
/**
 * Standard normal probability density function
 */
function normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
/**
 * Calculate d1 and d2 for Black-Scholes
 */
function calculateD1D2(S, K, r, sigma, T) {
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;
    return { d1, d2 };
}
/**
 * Calculate Greeks for a Call option
 */
function calculateCallGreeks(spotPrice, strikePrice, riskFreeRate, volatility, timeToExpiry) {
    const S = spotPrice;
    const K = strikePrice;
    const r = riskFreeRate;
    const sigma = volatility;
    const T = timeToExpiry;
    if (T <= 0) {
        // At expiry
        return {
            delta: S > K ? 1 : 0,
            gamma: 0,
            theta: 0,
            vega: 0,
            rho: 0,
        };
    }
    const { d1, d2 } = calculateD1D2(S, K, r, sigma, T);
    const sqrtT = Math.sqrt(T);
    const Nd1 = normalCDF(d1);
    const Nd2 = normalCDF(d2);
    const nd1 = normalPDF(d1);
    const expRT = Math.exp(-r * T);
    const delta = Nd1;
    const gamma = nd1 / (S * sigma * sqrtT);
    const theta = -(S * nd1 * sigma) / (2 * sqrtT) - r * K * expRT * Nd2;
    const vega = S * nd1 * sqrtT;
    const rho = K * T * expRT * Nd2;
    return { delta, gamma, theta, vega, rho };
}
/**
 * Calculate Greeks for a Put option
 */
function calculatePutGreeks(spotPrice, strikePrice, riskFreeRate, volatility, timeToExpiry) {
    const S = spotPrice;
    const K = strikePrice;
    const r = riskFreeRate;
    const sigma = volatility;
    const T = timeToExpiry;
    if (T <= 0) {
        // At expiry
        return {
            delta: S < K ? -1 : 0,
            gamma: 0,
            theta: 0,
            vega: 0,
            rho: 0,
        };
    }
    const { d1, d2 } = calculateD1D2(S, K, r, sigma, T);
    const sqrtT = Math.sqrt(T);
    const Nd1 = normalCDF(d1);
    const nd1 = normalPDF(d1);
    const expRT = Math.exp(-r * T);
    const delta = Nd1 - 1;
    const gamma = nd1 / (S * sigma * sqrtT);
    const theta = -(S * nd1 * sigma) / (2 * sqrtT) + r * K * expRT * normalCDF(-d2);
    const vega = S * nd1 * sqrtT;
    const rho = -K * T * expRT * normalCDF(-d2);
    return { delta, gamma, theta, vega, rho };
}
/**
 * Calculate deep ITM approximation for Call
 */
function deepITMCallApprox(spotPrice, strikePrice, riskFreeRate, timeToExpiry) {
    return spotPrice - strikePrice * Math.exp(-riskFreeRate * timeToExpiry);
}
/**
 * Calculate deep ITM approximation for Put
 */
function deepITMPutApprox(spotPrice, strikePrice, riskFreeRate, timeToExpiry) {
    return strikePrice * Math.exp(-riskFreeRate * timeToExpiry) - spotPrice;
}
/**
 * Calculate time value (ITM/OTM)
 */
function calculateTimeValue(ltp, spotPrice, strikePrice, isCall) {
    const intrinsicValue = isCall
        ? Math.max(0, spotPrice - strikePrice)
        : Math.max(0, strikePrice - spotPrice);
    return ltp - intrinsicValue;
}
//# sourceMappingURL=greeks.js.map