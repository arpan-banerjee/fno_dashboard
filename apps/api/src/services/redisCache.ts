/**
 * Redis Cache Service for Multi-Server Support
 * Replaces in-memory cache with Redis for distributed caching
 */

import Redis from 'ioredis';

interface CacheEntry {
  timestamp: number;
  data: any;
}

class RedisCache {
  private client: Redis;
  private readonly MAX_ENTRIES = 3;
  private readonly TTL_SECONDS = 86400; // 24 hours

  constructor() {
    // Initialize Redis client
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts to avoid flooding logs
        if (times > 3) {
          console.warn('⚠️  Redis unavailable. Caching disabled.');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true, // Don't connect immediately
    });

    // Handle Redis connection events
    this.client.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    this.client.on('error', (err) => {
      // Silently ignore connection errors - Redis is optional
      if (!err.message.includes('ECONNREFUSED')) {
        console.warn('⚠️  Redis error:', err.message);
      }
    });

    this.client.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    this.client.on('close', () => {
      // Silently ignore close - Redis is optional
    });
    
    // Try to connect
    this.client.connect().catch(() => {
      console.warn('⚠️  Redis not available. Caching disabled. Application will work without historical data.');
    });
  }

  /**
   * Generate cache key from symbol and expiry
   */
  private getCacheKey(symbol: string, expiry: string): string {
    return `option_chain:${symbol}_${expiry}`;
  }

  /**
   * Store option chain data in Redis
   */
  async store(symbol: string, expiry: string, data: any): Promise<void> {
    try {
      if (this.client.status !== 'ready') return; // Skip if not connected
      
      const key = this.getCacheKey(symbol, expiry);
      
      // Get existing entries
      const existingData = await this.client.get(key);
      let entries: CacheEntry[] = existingData ? JSON.parse(existingData) : [];

      // Add new entry
      entries.push({
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(data)), // Deep clone
      });

      // Keep only last MAX_ENTRIES
      if (entries.length > this.MAX_ENTRIES) {
        entries = entries.slice(-this.MAX_ENTRIES);
      }

      // Store in Redis with TTL
      await this.client.setex(key, this.TTL_SECONDS, JSON.stringify(entries));
      console.log(`📦 Cached option chain data in Redis for ${symbol} ${expiry} (${entries.length} snapshots)`);
    } catch (error) {
      // Silently fail - caching is optional
    }
  }

  /**
   * Get previous data (second-to-last entry)
   */
  async getPrevious(symbol: string, expiry: string): Promise<any | null> {
    try {
      if (this.client.status !== 'ready') return null;
      
      const key = this.getCacheKey(symbol, expiry);
      const data = await this.client.get(key);

      if (!data) return null;

      const entries: CacheEntry[] = JSON.parse(data);

      // Return second-to-last entry
      if (entries.length >= 2) {
        return entries[entries.length - 2].data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get latest data
   */
  async getLatest(symbol: string, expiry: string): Promise<any | null> {
    try {
      if (this.client.status !== 'ready') return null;
      
      const key = this.getCacheKey(symbol, expiry);
      const data = await this.client.get(key);

      if (!data) return null;

      const entries: CacheEntry[] = JSON.parse(data);

      if (entries.length > 0) {
        return entries[entries.length - 1].data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all cached entries for a symbol+expiry
   */
  async getAll(symbol: string, expiry: string): Promise<CacheEntry[]> {
    try {
      const key = this.getCacheKey(symbol, expiry);
      const data = await this.client.get(key);

      if (!data) return [];

      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error getting all data from Redis:', error);
      return [];
    }
  }

  /**
   * Clear cache for specific symbol+expiry
   */
  async clear(symbol: string, expiry: string): Promise<void> {
    try {
      const key = this.getCacheKey(symbol, expiry);
      await this.client.del(key);
      console.log(`🗑️  Cleared Redis cache for ${symbol} ${expiry}`);
    } catch (error) {
      console.error('❌ Error clearing Redis cache:', error);
    }
  }

  /**
   * Clear entire cache
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await this.client.keys('option_chain:*');
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      console.log('🗑️  Cleared entire Redis option chain cache');
    } catch (error) {
      console.error('❌ Error clearing all Redis cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ totalKeys: number; totalEntries: number }> {
    try {
      const keys = await this.client.keys('option_chain:*');
      let totalEntries = 0;

      for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
          const entries: CacheEntry[] = JSON.parse(data);
          totalEntries += entries.length;
        }
      }

      return {
        totalKeys: keys.length,
        totalEntries,
      };
    } catch (error) {
      console.error('❌ Error getting Redis cache stats:', error);
      return { totalKeys: 0, totalEntries: 0 };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
    console.log('👋 Redis client disconnected');
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client.status === 'ready';
  }
}

// Singleton instance
export const redisCache = new RedisCache();

// Export class for testing
export { RedisCache };
