/**
 * Market Data Polling Service
 * Fetches data from Dhan API periodically and broadcasts via WebSocket
 */

import { websocketService } from './websocket';
import { getDhanStream } from './dhanClient';
import { redisCache } from './redisCache';
import {
  calculateBuiltUp,
  calculatePCR,
  calculateVolumeColor,
  calculateOIColor,
  filterStrikeRange,
  findHighestVolumes,
  findHighestOI,
  findATMStrike,
  type StrikeData,
} from '../utils/optionChain.utils';
import {
  calculateTimeValue,
  calculateImpliedVolatility,
  getTimeToExpiry,
} from '../utils/optionsPricing';

interface PollerConfig {
  symbol: string;
  expiry: string;
  interval: number; // milliseconds
}

class MarketDataPoller {
  private pollers: Map<string, NodeJS.Timeout> = new Map();
  private activePolls: Map<string, PollerConfig> = new Map();

  /**
   * Start polling for a symbol+expiry combination
   * Default interval increased to 5000ms (5 seconds) to prevent rate limiting
   */
  startPolling(symbol: string, expiry: string, interval: number = 5000): void {
    const key = `${symbol}:${expiry}`;
    
    // Stop existing poller if any
    this.stopPolling(symbol, expiry);

    const config: PollerConfig = { symbol, expiry, interval };
    this.activePolls.set(key, config);

    console.log(`🔄 Starting market data polling for ${key} (${interval}ms interval)`);

    // Initial fetch
    this.fetchAndBroadcast(symbol, expiry);

    // Setup interval
    const timerId = setInterval(() => {
      this.fetchAndBroadcast(symbol, expiry);
    }, interval);

    this.pollers.set(key, timerId);
  }

  /**
   * Stop polling for a symbol+expiry combination
   */
  stopPolling(symbol: string, expiry: string): void {
    const key = `${symbol}:${expiry}`;
    const timerId = this.pollers.get(key);

    if (timerId) {
      clearInterval(timerId);
      this.pollers.delete(key);
      this.activePolls.delete(key);
      console.log(`⏹️  Stopped market data polling for ${key}`);
    }
  }

  /**
   * Fetch data from Dhan API and broadcast via WebSocket
   */
  private async fetchAndBroadcast(symbol: string, expiry: string): Promise<void> {
    try {
      const upperSymbol = symbol.toUpperCase();
      const dhanClient = getDhanStream();

      // Fetch option chain data
      let spotPrice = 0;
      let allStrikes: StrikeData[] = [];
      let isRealData = false;

      try {
        // Get spot price
        spotPrice = await dhanClient.getSpotPrice(upperSymbol);

        // Get option chain
        const chainData = await dhanClient.getOptionChain(upperSymbol, expiry);
        
        if (chainData && chainData.strikes) {
          isRealData = true;
          
          // Parse Dhan strikes
          allStrikes = chainData.strikes.map((strike: any) => ({
            strikePrice: strike.strikePrice || strike.strike,
            ceVolume: strike.CE?.volume || 0,
            peVolume: strike.PE?.volume || 0,
            ceOI: strike.CE?.oi || 0,
            peOI: strike.PE?.oi || 0,
            ceOIChange: strike.CE?.oiChange || 0,
            peOIChange: strike.PE?.oiChange || 0,
            ceLTP: strike.CE?.ltp || 0,
            peLTP: strike.PE?.ltp || 0,
            ceBidPrice: strike.CE?.bidPrice,
            ceBidQty: strike.CE?.bidQty,
            ceAskPrice: strike.CE?.askPrice,
            ceAskQty: strike.CE?.askQty,
            peBidPrice: strike.PE?.bidPrice,
            peBidQty: strike.PE?.bidQty,
            peAskPrice: strike.PE?.askPrice,
            peAskQty: strike.PE?.askQty,
          }));

          console.log(`✅ Fetched real option chain data for ${upperSymbol} ${expiry}: ${allStrikes.length} strikes`);
        }
      } catch (error) {
        console.warn(`⚠️  Dhan API failed for ${upperSymbol}, using mock data`);
        // Generate mock data as fallback
        ({ spotPrice, strikes: allStrikes } = this.generateMockData(upperSymbol));
      }

      // Filter strikes
      const filteredStrikes = filterStrikeRange(allStrikes, spotPrice);

      // Get previous data from cache
      const previousData = await redisCache.getPrevious(upperSymbol, expiry);

      // Find highest values
      const { highestCEVolume, highestPEVolume } = findHighestVolumes(filteredStrikes);
      const { highestCEOI, highestPEOI } = findHighestOI(filteredStrikes);

      // Find ATM strike
      const atmStrikePrice = findATMStrike(filteredStrikes, spotPrice);

      // Calculate time to expiry
      const timeToExpiry = getTimeToExpiry(expiry);
      const riskFreeRate = 0.065; // 6.5% for India

      // Enrich strikes with calculations
      const enrichedStrikes = filteredStrikes.map((strike) => {
        const previousStrike = previousData?.strikes?.find(
          (s: any) => s.strikePrice === strike.strikePrice
        );

        // Use real LTP or fallback values
        const ceLTP = strike.ceLTP || 0;
        const peLTP = strike.peLTP || 0;

        // Get previous values
        const previousCEVolume = previousStrike?.ceVolume || strike.ceVolume;
        const previousPEVolume = previousStrike?.peVolume || strike.peVolume;
        const previousCEOI = previousStrike?.ceOI || strike.ceOI;
        const previousPEOI = previousStrike?.peOI || strike.peOI;
        const previousCELTP = previousStrike?.ceLTP || ceLTP;
        const previousPELTP = previousStrike?.peLTP || peLTP;

        // Calculate LTP changes
        const ceLTPChange = ceLTP - previousCELTP;
        const peLTPChange = peLTP - previousPELTP;

        // Calculate TV and IV
        const ceTV = calculateTimeValue(ceLTP, spotPrice, strike.strikePrice, 'CE');
        const peTV = calculateTimeValue(peLTP, spotPrice, strike.strikePrice, 'PE');

        const ceIV = calculateImpliedVolatility(
          ceLTP,
          spotPrice,
          strike.strikePrice,
          timeToExpiry,
          riskFreeRate,
          'call'
        );

        const peIV = calculateImpliedVolatility(
          peLTP,
          spotPrice,
          strike.strikePrice,
          timeToExpiry,
          riskFreeRate,
          'put'
        );

        // Calculate colors
        const ceVolumeColor = calculateVolumeColor(strike.ceVolume, previousCEVolume, highestCEVolume, true);
        const peVolumeColor = calculateVolumeColor(strike.peVolume, previousPEVolume, highestPEVolume, false);
        const ceOIResult = calculateOIColor(strike.ceOI, previousCEOI, highestCEOI, true);
        const peOIResult = calculateOIColor(strike.peOI, previousPEOI, highestPEOI, false);

        // Calculate built-up
        const ceBuiltUp = calculateBuiltUp(strike.ceOIChange, ceLTPChange);
        const peBuiltUp = calculateBuiltUp(strike.peOIChange, peLTPChange);

        return {
          strikePrice: strike.strikePrice,
          isATM: strike.strikePrice === atmStrikePrice,
          ceVolume: strike.ceVolume,
          ceVolumeColor,
          ceOI: strike.ceOI,
          ceOIChange: strike.ceOIChange,
          ceOIColor: ceOIResult.color,
          ceShouldFadeOI: ceOIResult.shouldFade,
          ceLTP: parseFloat(ceLTP.toFixed(2)),
          ceLTPChange: parseFloat(ceLTPChange.toFixed(2)),
          ceTV: parseFloat(ceTV.toFixed(2)),
          ceIV: parseFloat(ceIV.toFixed(2)),
          ceBidPrice: strike.ceBidPrice || ceLTP - 0.5,
          ceBidQty: strike.ceBidQty || 0,
          ceAskPrice: strike.ceAskPrice || ceLTP + 0.5,
          ceAskQty: strike.ceAskQty || 0,
          ceBuiltUp: ceBuiltUp.classification,
          ceBuiltUpColor: ceBuiltUp.color,
          peVolume: strike.peVolume,
          peVolumeColor,
          peOI: strike.peOI,
          peOIChange: strike.peOIChange,
          peOIColor: peOIResult.color,
          peShouldFadeOI: peOIResult.shouldFade,
          peLTP: parseFloat(peLTP.toFixed(2)),
          peLTPChange: parseFloat(peLTPChange.toFixed(2)),
          peTV: parseFloat(peTV.toFixed(2)),
          peIV: parseFloat(peIV.toFixed(2)),
          peBidPrice: strike.peBidPrice || peLTP - 0.5,
          peBidQty: strike.peBidQty || 0,
          peAskPrice: strike.peAskPrice || peLTP + 0.5,
          peAskQty: strike.peAskQty || 0,
          peBuiltUp: peBuiltUp.classification,
          peBuiltUpColor: peBuiltUp.color,
        };
      });

      // Calculate PCR
      const pcr = calculatePCR(filteredStrikes);

      // Store in cache
      await redisCache.store(upperSymbol, expiry, {
        strikes: filteredStrikes,
        timestamp: Date.now(),
      });

      // Prepare broadcast data
      const broadcastData = {
        symbol: upperSymbol,
        expiry,
        spotPrice: parseFloat(spotPrice.toFixed(2)),
        atmStrike: atmStrikePrice,
        pcr,
        strikes: enrichedStrikes,
        timestamp: Date.now(),
        source: isRealData ? 'dhan' : 'mock',
      };

      // Broadcast to subscribers
      const channel = `option-chain:${upperSymbol}:${expiry}`;
      websocketService.broadcast(channel, broadcastData);

    } catch (error) {
      console.error(`❌ Error fetching market data for ${symbol} ${expiry}:`, error);
    }
  }

  /**
   * Generate mock data for testing
   */
  private generateMockData(symbol: string): { spotPrice: number; strikes: StrikeData[] } {
    const mockSpotPrices: { [key: string]: number } = {
      'NIFTY': 19500,
      'BANKNIFTY': 43500,
      'FINNIFTY': 19800,
      'MIDCAPNIFTY': 9500,
      'SENSEX': 65000,
    };

    const spotPrice = mockSpotPrices[symbol] || 19500;
    const strikes: StrikeData[] = [];

    for (let i = -15; i <= 15; i++) {
      const strikePrice = spotPrice + i * 50;
      strikes.push({
        strikePrice,
        ceVolume: Math.floor(Math.random() * 50000),
        peVolume: Math.floor(Math.random() * 50000),
        ceOI: Math.floor(Math.random() * 100000),
        peOI: Math.floor(Math.random() * 100000),
        ceOIChange: Math.floor(Math.random() * 20000) - 10000,
        peOIChange: Math.floor(Math.random() * 20000) - 10000,
        ceLTP: Math.random() * 200,
        peLTP: Math.random() * 200,
      });
    }

    return { spotPrice, strikes };
  }

  /**
   * Start polling for IV data
   * Default interval increased to 10000ms (10 seconds) to prevent rate limiting
   */
  startIVPolling(symbol: string, interval: number = 10000): void {
    const key = `iv:${symbol}`;
    
    // Stop existing poller if any
    this.stopIVPolling(symbol);

    console.log(`🔄 Starting IV polling for ${symbol} (${interval}ms interval)`);

    // Initial fetch
    this.fetchAndBroadcastIV(symbol);

    // Setup interval
    const timerId = setInterval(() => {
      this.fetchAndBroadcastIV(symbol);
    }, interval);

    this.pollers.set(key, timerId);
  }

  /**
   * Stop IV polling
   */
  stopIVPolling(symbol: string): void {
    const key = `iv:${symbol}`;
    const timerId = this.pollers.get(key);

    if (timerId) {
      clearInterval(timerId);
      this.pollers.delete(key);
      console.log(`⏹️  Stopped IV polling for ${symbol}`);
    }
  }

  /**
   * Fetch IV data and broadcast
   */
  private async fetchAndBroadcastIV(symbol: string): Promise<void> {
    try {
      const upperSymbol = symbol.toUpperCase();
      const dhanClient = getDhanStream();
      let currentIV = 0;
      let previousIV = 0;
      let isRealData = false;

      try {
        const ivData = await dhanClient.getIVData(upperSymbol);
        
        if (ivData && ivData.ltp) {
          currentIV = ivData.ltp;
          isRealData = true;

          // Get previous IV from cache
          const cacheKey = `iv_${upperSymbol}`;
          const cachedIV = await redisCache.getLatest(cacheKey, 'iv');
          
          if (cachedIV && cachedIV.iv) {
            previousIV = cachedIV.iv;
          } else {
            previousIV = currentIV;
          }

          // Store current IV
          await redisCache.store(cacheKey, 'iv', { iv: currentIV });
        }
      } catch (error) {
        console.warn(`⚠️  Dhan IV API failed for ${upperSymbol}, using mock data`);
        const mockIVDEX: { [key: string]: number } = {
          'NIFTY': 15.5,
          'BANKNIFTY': 18.2,
          'FINNIFTY': 16.8,
          'MIDCAPNIFTY': 17.5,
          'SENSEX': 14.9,
        };
        currentIV = mockIVDEX[upperSymbol] || 15.0;
        previousIV = currentIV * 0.98; // Mock previous value
      }

      // Calculate trend
      const ivChange = parseFloat((currentIV - previousIV).toFixed(2));
      let trend = '→';
      let trendColor = '#999';

      if (ivChange > 0) {
        trend = '▲';
        trendColor = ivChange > 1 ? '#f44336' : '#ff9800';
      } else if (ivChange < 0) {
        trend = '▼';
        trendColor = '#4caf50';
      }

      // Broadcast data
      const broadcastData = {
        currentIV: parseFloat(currentIV.toFixed(2)),
        previousIV: parseFloat(previousIV.toFixed(2)),
        ivChange,
        trend,
        trendColor,
        timestamp: Date.now(),
        source: isRealData ? 'dhan' : 'mock',
      };

      const channel = `ivdex:${upperSymbol}`;
      websocketService.broadcast(channel, broadcastData);

    } catch (error) {
      console.error(`❌ Error fetching IV data for ${symbol}:`, error);
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    this.pollers.forEach((timerId, key) => {
      clearInterval(timerId);
      console.log(`⏹️  Stopped polling for ${key}`);
    });
    this.pollers.clear();
    this.activePolls.clear();
  }

  /**
   * Get active polls
   */
  getActivePolls(): string[] {
    return Array.from(this.activePolls.keys());
  }
}

// Singleton instance
export const marketDataPoller = new MarketDataPoller();

// Export class for testing
export { MarketDataPoller };
