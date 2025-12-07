/**
 * Option Chain Cache for Historical Data Comparison
 * Stores last 3 snapshots of option chain data per symbol+expiry
 */

interface CacheEntry {
  timestamp: number;
  data: any; // Will be typed properly when integrated
}

class OptionChainCache {
  private cache: Map<string, CacheEntry[]> = new Map();
  private readonly MAX_ENTRIES = 3;

  /**
   * Generate cache key from symbol and expiry
   */
  private getCacheKey(symbol: string, expiry: string): string {
    return `${symbol}_${expiry}`;
  }

  /**
   * Store option chain data in cache
   */
  store(symbol: string, expiry: string, data: any): void {
    const key = this.getCacheKey(symbol, expiry);
    const entries = this.cache.get(key) || [];

    // Add new entry
    entries.push({
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
    });

    // Keep only last MAX_ENTRIES
    if (entries.length > this.MAX_ENTRIES) {
      entries.shift();
    }

    this.cache.set(key, entries);
    console.log(`📦 Cached option chain data for ${symbol} ${expiry} (${entries.length} snapshots)`);
  }

  /**
   * Get previous data (second-to-last entry)
   */
  getPrevious(symbol: string, expiry: string): any | null {
    const key = this.getCacheKey(symbol, expiry);
    const entries = this.cache.get(key) || [];

    // Return second-to-last entry
    if (entries.length >= 2) {
      return entries[entries.length - 2].data;
    }

    return null;
  }

  /**
   * Get latest data
   */
  getLatest(symbol: string, expiry: string): any | null {
    const key = this.getCacheKey(symbol, expiry);
    const entries = this.cache.get(key) || [];

    if (entries.length > 0) {
      return entries[entries.length - 1].data;
    }

    return null;
  }

  /**
   * Get all cached entries for a symbol+expiry
   */
  getAll(symbol: string, expiry: string): CacheEntry[] {
    const key = this.getCacheKey(symbol, expiry);
    return this.cache.get(key) || [];
  }

  /**
   * Clear cache for specific symbol+expiry
   */
  clear(symbol: string, expiry: string): void {
    const key = this.getCacheKey(symbol, expiry);
    this.cache.delete(key);
    console.log(`🗑️  Cleared cache for ${symbol} ${expiry}`);
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
    console.log('🗑️  Cleared entire option chain cache');
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalKeys: number; totalEntries: number } {
    let totalEntries = 0;
    this.cache.forEach((entries) => {
      totalEntries += entries.length;
    });

    return {
      totalKeys: this.cache.size,
      totalEntries,
    };
  }
}

// Singleton instance
export const optionChainCache = new OptionChainCache();
