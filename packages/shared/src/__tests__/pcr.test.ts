import { describe, it, expect } from 'vitest';
import { calculatePCR, formatPCR, interpretPCR } from '../utils/pcr';

describe('PCR Calculations', () => {
  it('should calculate PCR correctly', () => {
    const pcr = calculatePCR(1000000, 800000);
    expect(pcr).toBe(1.25);
  });

  it('should handle zero call OI (infinity)', () => {
    const pcr = calculatePCR(1000, 0);
    expect(pcr).toBe(Infinity);
  });

  it('should handle zero put OI', () => {
    const pcr = calculatePCR(0, 1000);
    expect(pcr).toBe(0);
  });

  it('should handle both zero (0/0)', () => {
    const pcr = calculatePCR(0, 0);
    expect(pcr).toBe(0);
  });

  it('should format PCR correctly', () => {
    expect(formatPCR(1.2567)).toBe('1.26');
    expect(formatPCR(0.8934, 3)).toBe('0.893');
    expect(formatPCR(Infinity)).toBe('∞');
    expect(formatPCR(0)).toBe('0.00');
  });

  it('should interpret PCR correctly', () => {
    expect(interpretPCR(0.5)).toBe('bullish');
    expect(interpretPCR(1.0)).toBe('neutral');
    expect(interpretPCR(1.5)).toBe('bearish');
    expect(interpretPCR(0.8)).toBe('neutral'); // Border case
    expect(interpretPCR(1.2)).toBe('neutral'); // Border case
  });
});
