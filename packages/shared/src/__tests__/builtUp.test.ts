import { describe, it, expect } from 'vitest';
import { classifyBuiltUp, getBuiltUpStyle } from '../logic/builtUp';

describe('Built-Up Classification', () => {
  it('should classify Long Built Up (price ↑, OI ↑)', () => {
    const result = classifyBuiltUp(5, 10);
    expect(result).toBe('Long Built Up');
  });

  it('should classify Short Cover (price ↑, OI ↓)', () => {
    const result = classifyBuiltUp(5, -10);
    expect(result).toBe('Short Cover');
  });

  it('should classify Short Built Up (price ↓, OI ↑)', () => {
    const result = classifyBuiltUp(-5, 10);
    expect(result).toBe('Short Built Up');
  });

  it('should classify Long Unwind (price ↓, OI ↓)', () => {
    const result = classifyBuiltUp(-5, -10);
    expect(result).toBe('Long Unwind');
  });

  it('should return null for insignificant changes with threshold', () => {
    const result = classifyBuiltUp(0.5, 0.5, {
      priceChangeThreshold: 1,
      oiChangeThreshold: 1,
    });
    expect(result).toBeNull();
  });

  it('should classify with zero threshold', () => {
    const result = classifyBuiltUp(0.1, 0.1);
    expect(result).toBe('Long Built Up');
  });

  it('should handle edge case: zero price change', () => {
    const result = classifyBuiltUp(0, 10);
    expect(result).toBe('Short Built Up');
  });

  it('should handle edge case: zero OI change', () => {
    const result = classifyBuiltUp(5, 0);
    expect(result).toBe('Short Cover');
  });

  it('should provide correct styles for each type', () => {
    const longBuiltStyle = getBuiltUpStyle('Long Built Up');
    expect(longBuiltStyle.backgroundColor).toBe('#2e7d32');
    
    const shortCoverStyle = getBuiltUpStyle('Short Cover');
    expect(shortCoverStyle.backgroundColor).toBe('#81c784');
    
    const shortBuiltStyle = getBuiltUpStyle('Short Built Up');
    expect(shortBuiltStyle.backgroundColor).toBe('#c62828');
    
    const longUnwindStyle = getBuiltUpStyle('Long Unwind');
    expect(longUnwindStyle.backgroundColor).toBe('#ef9a9a');
  });
});
