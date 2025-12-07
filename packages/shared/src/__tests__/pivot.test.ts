import { describe, it, expect } from 'vitest';
import { calculateClassicPivot, calculateFibonacciPivot, calculateCamarillaPivot } from '../formulas/pivot';

describe('Pivot Calculations', () => {
  const ohlc = {
    high: 18500,
    low: 17500,
    close: 18000,
  };

  describe('Classic Pivot', () => {
    it('should calculate classic pivot correctly', () => {
      const pivot = calculateClassicPivot(ohlc);
      
      // Pivot = (18500 + 17500 + 18000) / 3 = 18000
      expect(pivot.pivot).toBeCloseTo(18000, 2);
      
      // R1 = 2 * 18000 - 17500 = 18500
      expect(pivot.r1).toBeCloseTo(18500, 2);
      
      // S1 = 2 * 18000 - 18500 = 17500
      expect(pivot.s1).toBeCloseTo(17500, 2);
      
      // R2 = 18000 + (18500 - 17500) = 19000
      expect(pivot.r2).toBeCloseTo(19000, 2);
      
      // S2 = 18000 - (18500 - 17500) = 17000
      expect(pivot.s2).toBeCloseTo(17000, 2);
    });
  });

  describe('Fibonacci Pivot', () => {
    it('should calculate fibonacci pivot correctly', () => {
      const pivot = calculateFibonacciPivot(ohlc);
      
      expect(pivot.pivot).toBeCloseTo(18000, 2);
      
      // Range = 1000
      // R1 = 18000 + 0.382 * 1000 = 18382
      expect(pivot.r1).toBeCloseTo(18382, 2);
      
      // R2 = 18000 + 0.618 * 1000 = 18618
      expect(pivot.r2).toBeCloseTo(18618, 2);
      
      // S1 = 18000 - 0.382 * 1000 = 17618
      expect(pivot.s1).toBeCloseTo(17618, 2);
      
      // S2 = 18000 - 0.618 * 1000 = 17382
      expect(pivot.s2).toBeCloseTo(17382, 2);
    });
  });

  describe('Camarilla Pivot', () => {
    it('should calculate camarilla pivot correctly', () => {
      const pivot = calculateCamarillaPivot(ohlc);
      
      expect(pivot.pivot).toBeCloseTo(18000, 2);
      
      // Range = 1000, factor = 1.1 * 1000 = 1100
      // R1 = 18000 + 1100/12 = 18091.67
      expect(pivot.r1).toBeCloseTo(18091.67, 2);
      
      // R2 = 18000 + 1100/6 = 18183.33
      expect(pivot.r2).toBeCloseTo(18183.33, 2);
      
      // S1 = 18000 - 1100/12 = 17908.33
      expect(pivot.s1).toBeCloseTo(17908.33, 2);
      
      // S2 = 18000 - 1100/6 = 17816.67
      expect(pivot.s2).toBeCloseTo(17816.67, 2);
    });
  });
});
