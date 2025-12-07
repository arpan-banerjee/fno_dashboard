import { describe, it, expect } from 'vitest';
import {
  calculateVixRange,
  calculateDailyRange,
  calculateWeeklyRange,
  calculateMonthlyRange,
  TIME_FACTORS,
} from '../formulas/vix';

describe('VIX Range Calculations', () => {
  it('should calculate daily range correctly', () => {
    const spot = 18000;
    const vix = 15;
    const range = calculateDailyRange(spot, vix);
    
    // R = 18000 * (15/100) * 0.0523 = 141.21
    expect(range.rangeValue).toBeCloseTo(141.21, 1);
    expect(range.upper).toBeCloseTo(18141.21, 1);
    expect(range.lower).toBeCloseTo(17858.79, 1);
    expect(range.upsideTarget).toBeCloseTo(18423.63, 1);
    expect(range.downsideTarget).toBeCloseTo(17576.37, 1);
  });

  it('should calculate weekly range correctly', () => {
    const spot = 18000;
    const vix = 15;
    const range = calculateWeeklyRange(spot, vix);
    
    // R = 18000 * (15/100) * 0.1171 = 316.17
    expect(range.rangeValue).toBeCloseTo(316.17, 1);
    expect(range.upper).toBeCloseTo(18316.17, 1);
    expect(range.lower).toBeCloseTo(17683.83, 1);
  });

  it('should calculate monthly range correctly', () => {
    const spot = 18000;
    const vix = 15;
    const range = calculateMonthlyRange(spot, vix);
    
    // R = 18000 * (15/100) * 0.2867 = 774.09
    expect(range.rangeValue).toBeCloseTo(774.09, 1);
    expect(range.upper).toBeCloseTo(18774.09, 1);
    expect(range.lower).toBeCloseTo(17225.91, 1);
  });

  it('should handle high VIX values', () => {
    const spot = 20000;
    const vix = 30; // High volatility
    const range = calculateDailyRange(spot, vix);
    
    expect(range.rangeValue).toBeGreaterThan(300);
    expect(range.upsideTarget - spot).toBeGreaterThan(900);
  });

  it('should scale proportionally with spot price', () => {
    const vix = 15;
    const range1 = calculateDailyRange(10000, vix);
    const range2 = calculateDailyRange(20000, vix);
    
    expect(range2.rangeValue).toBeCloseTo(range1.rangeValue * 2, 1);
  });
});
