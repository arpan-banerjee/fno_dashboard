import { Router, Response } from 'express';
import { IndexInfo, OptionChain, SummaryStats, Targets, VixRange } from '@option-dashboard/shared';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getOptionChain, getSummaryStats } from '../services/optionChain';
import { calculateDailyRange, calculateWeeklyRange, calculateMonthlyRange } from '@option-dashboard/shared';
import { getPivotLevels } from '../services/pivot';
import { getDhanStream } from '../services/dhanClient';
import { redisCache } from '../services/redisCache';
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
import {
  calculateCallGreeks,
  calculatePutGreeks,
} from '@option-dashboard/shared';
import { marketDataPoller } from '../services/marketDataPoller';

const router = Router();

// All market routes require authentication
router.use(authenticate);

/**
 * GET /market/indices
 * Get list of available indices with current spot prices
 */
router.get('/indices', (req: AuthRequest, res: Response) => {
  const indices: IndexInfo[] = [
    { label: 'NIFTY 50', name: 'nifty50', hasDropdown: true, expiries: [] },
    { label: 'BANK NIFTY', name: 'banknifty', hasDropdown: true, expiries: [] },
    { label: 'FIN NIFTY', name: 'finnifty', hasDropdown: true, expiries: [] },
    { label: 'MIDCAP NIFTY', name: 'midcapnifty', hasDropdown: true, expiries: [] },
    { label: 'SENSEX', name: 'sensex', hasDropdown: true, expiries: [] },
    { label: 'BANKEX', name: 'bankex', hasDropdown: true, expiries: [] },
    { label: 'FNO', name: 'fno', hasDropdown: false },
    { label: 'IV', name: 'iv', hasDropdown: false },
    { label: 'Monthly Range', name: 'monthly_range', hasDropdown: false },
    { label: 'Weekly Range', name: 'weekly_range', hasDropdown: false },
    { label: 'Daily Range', name: 'daily_range', hasDropdown: false },
  ];

  res.json(indices);
});

/**
 * GET /market/option-chain
 * Get option chain for specified index and expiry
 */
router.get('/option-chain', async (req: AuthRequest, res: Response) => {
  try {
    const { index = 'nifty50', expiry } = req.query;
    
    const chain = await getOptionChain(
      index as string,
      expiry as string | undefined
    );
    
    res.json(chain);
  } catch (error) {
    console.error('Error fetching option chain:', error);
    res.status(500).json({ error: 'Failed to fetch option chain' });
  }
});

/**
 * GET /market/summary
 * Get summary statistics (totals, PCR, Greeks)
 */
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { index = 'nifty50', expiry } = req.query;
    
    const stats = await getSummaryStats(
      index as string,
      expiry as string | undefined
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * GET /market/ranges
 * Get VIX-based ranges for daily/weekly/monthly
 */
router.get('/ranges', (req: AuthRequest, res: Response) => {
  try {
    const { spot = 18000, vix = 15 } = req.query;
    
    const spotPrice = Number(spot);
    const vixValue = Number(vix);
    
    const ranges = {
      daily: calculateDailyRange(spotPrice, vixValue),
      weekly: calculateWeeklyRange(spotPrice, vixValue),
      monthly: calculateMonthlyRange(spotPrice, vixValue),
    };
    
    res.json(ranges);
  } catch (error) {
    console.error('Error calculating ranges:', error);
    res.status(500).json({ error: 'Failed to calculate ranges' });
  }
});

/**
 * GET /market/pivot
 * Get pivot levels for the current period
 */
router.get('/pivot', async (req: AuthRequest, res: Response) => {
  try {
    const { index = 'nifty50' } = req.query;
    
    const pivots = await getPivotLevels(index as string);
    
    res.json(pivots);
  } catch (error) {
    console.error('Error calculating pivots:', error);
    res.status(500).json({ error: 'Failed to calculate pivots' });
  }
});

/**
 * GET /market/spot-price
 * Get real-time spot price for a symbol from Dhan API
 */
router.get('/spot-price', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol = 'NIFTY' } = req.query;
    
    const dhanClient = getDhanStream();
    const spotPrice = await dhanClient.getSpotPrice(symbol as string);
    
    res.json({ 
      symbol: symbol as string,
      spotPrice,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching spot price:', error);
    res.status(500).json({ 
      error: 'Failed to fetch spot price',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /market/quotes/:symbol
 * Get current market price (LTP) with change indicators
 * Symbols: NIFTY, BANKNIFTY, FINNIFTY, MIDCAPNIFTY, SENSEX
 */
router.get('/quotes/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    // Validate symbol
    const validSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCAPNIFTY', 'SENSEX'];
    if (!validSymbols.includes(upperSymbol)) {
      return res.status(400).json({ 
        error: 'Invalid symbol',
        message: `Symbol must be one of: ${validSymbols.join(', ')}`
      });
    }
    
    let ltp: number;
    let isRealData = false;
    
    // Try to fetch from Dhan API
    try {
      const dhanClient = getDhanStream();
      ltp = await dhanClient.getSpotPrice(upperSymbol);
      isRealData = true;
      console.log(`✅ Real data from Dhan API for ${upperSymbol}: ${ltp}`);
    } catch (dhanError) {
      // Fallback to mock data if Dhan API fails
      console.warn(`⚠️  Dhan API failed for ${upperSymbol}, using mock data:`, 
        dhanError instanceof Error ? dhanError.message : 'Unknown error');
      
      const mockPrices: { [key: string]: number } = {
        'NIFTY': 19650.50,
        'BANKNIFTY': 44250.75,
        'FINNIFTY': 19850.25,
        'MIDCAPNIFTY': 45600.00,
        'SENSEX': 65800.50,
      };
      
      const baseLtp = mockPrices[upperSymbol] || 20000;
      const randomVariation = (Math.random() - 0.5) * 100; // +/- 50 points
      ltp = baseLtp + randomVariation;
    }
    
    // Mock change data (will be replaced with real calculation from historical data)
    const mockChange = (Math.random() - 0.5) * 200; // Random change for demo
    const changePercent = (mockChange / ltp) * 100;
    
    res.json({ 
      symbol: upperSymbol,
      ltp: parseFloat(ltp.toFixed(2)),
      change: parseFloat(mockChange.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: Date.now(),
      source: isRealData ? 'dhan' : 'mock' // Indicate data source
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quote',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /market/test-dhan/:symbol
 * Test Dhan API connection and response format
 */
router.get('/test-dhan/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    console.log(`🧪 Testing Dhan API for ${upperSymbol}...`);
    
    const dhanClient = getDhanStream();
    const ltp = await dhanClient.getSpotPrice(upperSymbol);
    
    res.json({
      success: true,
      symbol: upperSymbol,
      ltp,
      message: 'Dhan API connection successful'
    });
  } catch (error) {
    console.error('Dhan API test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Dhan API test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
});

/**
 * GET /market/expiries/:symbol
 * Get next 3 expiry dates for an index
 * Uses Dhan option-chain API to extract available expiries
 */
router.get('/expiries/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    // Validate symbol
    const validSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCAPNIFTY', 'SENSEX'];
    if (!validSymbols.includes(upperSymbol)) {
      return res.status(400).json({ 
        error: 'Invalid symbol',
        message: `Symbol must be one of: ${validSymbols.join(', ')}`
      });
    }
    
    let expiries: Array<{ date: string; label: string }> = [];
    let isRealData = false;

    try {
      // Try to fetch real expiries from Dhan API
      const dhanClient = getDhanStream();
      const dhanExpiries = await dhanClient.getExpiries(upperSymbol);
      
      if (dhanExpiries && dhanExpiries.length > 0) {
        expiries = dhanExpiries.slice(0, 3).map((expiryDate: string) => {
          const date = new Date(expiryDate);
          const label = date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          return { date: expiryDate, label };
        });
        isRealData = true;
        console.log(`✅ Real expiries from Dhan for ${upperSymbol}`);
      }
    } catch (dhanError) {
      console.warn(`⚠️  Dhan expiries API failed for ${upperSymbol}, using mock data`);
    }

    // Fallback to mock expiry dates if Dhan API fails
    if (expiries.length === 0) {
      const today = new Date();
      
      // Generate next 3 weekly expiries (Thursdays for NIFTY/BANKNIFTY)
      for (let i = 0; i < 3; i++) {
        const nextThursday = new Date(today);
        nextThursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7 || 7) + (i * 7));
        
        const dateStr = nextThursday.toISOString().split('T')[0];
        const label = nextThursday.toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
        
        expiries.push({ date: dateStr, label });
      }
    }
    
    res.json({ 
      symbol: upperSymbol,
      expiries,
      source: isRealData ? 'dhan' : 'mock',
    });
  } catch (error) {
    console.error('Error fetching expiries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expiries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /market/ivdex/:symbol
 * Get IVDEX (IV Index) with trend arrow
 * Returns current IV, previous IV, and trend indicator
 */
router.get('/ivdex/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    // Validate symbol
    const validSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCAPNIFTY', 'SENSEX'];
    if (!validSymbols.includes(upperSymbol)) {
      return res.status(400).json({ 
        error: 'Invalid symbol',
        message: `Symbol must be one of: ${validSymbols.join(', ')}`
      });
    }
    
    let currentIV = 15.0;
    let previousIV = 15.0;
    let isRealData = false;

    try {
      // Try to fetch real IV data from Dhan API
      const dhanClient = getDhanStream();
      const ivData = await dhanClient.getIVData(upperSymbol);
      
      if (ivData && ivData.ltp) {
        currentIV = ivData.ltp;
        isRealData = true;
        console.log(`✅ Real IV data from Dhan for ${upperSymbol}: ${currentIV}`);
        
        // Get previous IV from cache
        const cacheKey = `iv_${upperSymbol}`;
        const cachedIV = await redisCache.getLatest(cacheKey, 'iv');
        if (cachedIV && cachedIV.iv) {
          previousIV = cachedIV.iv;
        } else {
          previousIV = currentIV; // First time, no change
        }
        
        // Store current IV in cache for next comparison
        await redisCache.store(cacheKey, 'iv', { iv: currentIV });
      }
    } catch (dhanError) {
      console.warn(`⚠️  Dhan IV API failed for ${upperSymbol}, using mock data`);
      // Use mock data as fallback
      const mockIVDEX: { [key: string]: number } = {
        'NIFTY': 15.5,
        'BANKNIFTY': 18.2,
        'FINNIFTY': 16.8,
        'MIDCAPNIFTY': 17.5,
        'SENSEX': 14.9,
      };
      currentIV = mockIVDEX[upperSymbol] || 15.0;
      previousIV = currentIV + (Math.random() - 0.5) * 2;
    }
    
    const ivChange = currentIV - previousIV;
    
    // Determine trend arrow
    let trend: '▲' | '▼' | '→' = '→';
    let trendColor = '#9e9e9e'; // Grey for neutral
    
    if (ivChange > 0) {
      trend = '▲';
      trendColor = ivChange > 1 ? '#f44336' : '#ff9800'; // Red if >1, Orange otherwise
    } else if (ivChange < 0) {
      trend = '▼';
      trendColor = '#4caf50'; // Green
    }
    
    res.json({
      symbol: upperSymbol,
      currentIV: parseFloat(currentIV.toFixed(2)),
      previousIV: parseFloat(previousIV.toFixed(2)),
      ivChange: parseFloat(ivChange.toFixed(2)),
      trend,
      trendColor,
      timestamp: Date.now(),
      source: isRealData ? 'dhan' : 'mock',
    });
  } catch (error) {
    console.error('Error fetching IVDEX:', error);
    res.status(500).json({ 
      error: 'Failed to fetch IVDEX',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /market/option-chain/:symbol/:expiry
 * Get enriched option chain with color coding and built-up classification
 * Returns ATM ± 15 strikes with advanced color logic
 */
router.get('/option-chain/:symbol/:expiry', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, expiry } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    // Validate symbol
    const validSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCAPNIFTY', 'SENSEX'];
    if (!validSymbols.includes(upperSymbol)) {
      return res.status(400).json({ 
        error: 'Invalid symbol',
        message: `Symbol must be one of: ${validSymbols.join(', ')}`
      });
    }
    
    let spotPrice: number;
    let allStrikes: StrikeData[] = [];
    let isRealData = false;
    const riskFreeRate = 0.065; // 6.5% for India

    // Get spot price
    const dhanClient = getDhanStream();
    try {
      spotPrice = await dhanClient.getSpotPrice(upperSymbol);
      console.log(`✅ Spot price from Dhan: ${spotPrice}`);
    } catch {
      // Fallback to mock spot price
      const mockSpots: { [key: string]: number } = {
        'NIFTY': 19650,
        'BANKNIFTY': 44250,
        'FINNIFTY': 19850,
        'MIDCAPNIFTY': 45600,
        'SENSEX': 65800,
      };
      spotPrice = mockSpots[upperSymbol] || 20000;
      console.warn(`⚠️  Using mock spot price: ${spotPrice}`);
    }

    // Calculate time to expiry
    const timeToExpiry = getTimeToExpiry(expiry);

    // Try to fetch real option chain from Dhan API
    try {
      const optionChainData = await dhanClient.getOptionChain(upperSymbol, expiry);
      
      if (optionChainData && optionChainData.strikes) {
        console.log(`✅ Real option chain data from Dhan`);
        isRealData = true;
        
        // Parse Dhan option chain data
        allStrikes = optionChainData.strikes.map((strikeData: any) => {
          const strike = strikeData.strike || strikeData.strikePrice;
          const ce = strikeData.CE || strikeData.call || {};
          const pe = strikeData.PE || strikeData.put || {};
          
          return {
            strikePrice: strike,
            ceVolume: ce.volume || 0,
            ceOI: ce.oi || ce.openInterest || 0,
            ceOIChange: ce.oiChange || 0,
            ceLTP: ce.ltp || ce.lastPrice || 0,
            ceBidPrice: ce.bidPrice || 0,
            ceBidQty: ce.bidQty || 0,
            ceAskPrice: ce.askPrice || 0,
            ceAskQty: ce.askQty || 0,
            peVolume: pe.volume || 0,
            peOI: pe.oi || pe.openInterest || 0,
            peOIChange: pe.oiChange || 0,
            peLTP: pe.ltp || pe.lastPrice || 0,
            peBidPrice: pe.bidPrice || 0,
            peBidQty: pe.bidQty || 0,
            peAskPrice: pe.askPrice || 0,
            peAskQty: pe.askQty || 0,
          };
        });
      }
    } catch (dhanError) {
      console.warn(`⚠️  Dhan option chain API failed, using mock data`);
    }

    // Fallback to mock data if Dhan API fails
    if (allStrikes.length === 0) {
      const strikeStep = upperSymbol === 'BANKNIFTY' ? 100 : 50;
      const atmStrike = Math.round(spotPrice / strikeStep) * strikeStep;
      
      for (let i = -30; i <= 30; i++) {
        const strike = atmStrike + (i * strikeStep);
        const ceLTP = Math.max(1, spotPrice - strike + Math.random() * 50);
        const peLTP = Math.max(1, strike - spotPrice + Math.random() * 50);
        
        allStrikes.push({
          strikePrice: strike,
          ceVolume: Math.floor(Math.random() * 100000),
          ceOI: Math.floor(Math.random() * 500000),
          ceOIChange: Math.floor((Math.random() - 0.5) * 100000),
          ceLTP,
          ceBidPrice: ceLTP - Math.random() * 2,
          ceBidQty: Math.floor(Math.random() * 2000),
          ceAskPrice: ceLTP + Math.random() * 2,
          ceAskQty: Math.floor(Math.random() * 2000),
          peVolume: Math.floor(Math.random() * 100000),
          peOI: Math.floor(Math.random() * 500000),
          peOIChange: Math.floor((Math.random() - 0.5) * 100000),
          peLTP,
          peBidPrice: peLTP - Math.random() * 2,
          peBidQty: Math.floor(Math.random() * 2000),
          peAskPrice: peLTP + Math.random() * 2,
          peAskQty: Math.floor(Math.random() * 2000),
        });
      }
    }
    
    // Filter to ATM ± 15 strikes
    const filteredStrikes = filterStrikeRange(allStrikes, spotPrice);
    
    // Get previous data from cache
    const previousData = await redisCache.getPrevious(upperSymbol, expiry);
    
    // Find highest values for current data
    const { highestCEVolume, highestPEVolume } = findHighestVolumes(filteredStrikes);
    const { highestCEOI, highestPEOI } = findHighestOI(filteredStrikes);
    
    // Find ATM strike
    const atmStrikePrice = findATMStrike(filteredStrikes, spotPrice);
    
    // Enrich each strike with color flags and built-up classification
    const enrichedStrikes = filteredStrikes.map((strike) => {
      // Get previous values
      const previousStrike = previousData?.strikes?.find(
        (s: any) => s.strikePrice === strike.strikePrice
      );
      const previousCEVolume = previousStrike?.ceVolume || 0;
      const previousPEVolume = previousStrike?.peVolume || 0;
      const previousCEOI = previousStrike?.ceOI || 0;
      const previousPEOI = previousStrike?.peOI || 0;
      
      // Calculate colors
      const ceVolumeColor = calculateVolumeColor(
        strike.ceVolume,
        previousCEVolume,
        highestCEVolume,
        true
      );
      const peVolumeColor = calculateVolumeColor(
        strike.peVolume,
        previousPEVolume,
        highestPEVolume,
        false
      );
      
      const ceOIResult = calculateOIColor(
        strike.ceOI,
        previousCEOI,
        highestCEOI,
        true
      );
      const peOIResult = calculateOIColor(
        strike.peOI,
        previousPEOI,
        highestPEOI,
        false
      );
      
      // Use real LTP or calculate mock values
      const ceLTP = strike.ceLTP || (Math.max(1, spotPrice - strike.strikePrice + Math.random() * 50));
      const peLTP = strike.peLTP || (Math.max(1, strike.strikePrice - spotPrice + Math.random() * 50));
      
      // Calculate LTP change from previous data
      const previousCELTP = previousStrike?.ceLTP || ceLTP;
      const previousPELTP = previousStrike?.peLTP || peLTP;
      const ceLTPChange = ceLTP - previousCELTP;
      const peLTPChange = peLTP - previousPELTP;
      
      // Calculate Time Value (TV)
      const ceTV = calculateTimeValue(ceLTP, spotPrice, strike.strikePrice, 'CE');
      const peTV = calculateTimeValue(peLTP, spotPrice, strike.strikePrice, 'PE');
      
      // Calculate Implied Volatility (IV)
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
      
      // Calculate built-up
      const ceBuiltUp = calculateBuiltUp(strike.ceOIChange, ceLTPChange);
      const peBuiltUp = calculateBuiltUp(strike.peOIChange, peLTPChange);
      
      // Calculate Greeks for CE (Call)
      const ceGreeks = calculateCallGreeks(
        spotPrice,
        strike.strikePrice,
        riskFreeRate,
        ceIV,
        timeToExpiry
      );
      
      // Calculate Greeks for PE (Put)
      const peGreeks = calculatePutGreeks(
        spotPrice,
        strike.strikePrice,
        riskFreeRate,
        peIV,
        timeToExpiry
      );
      
      return {
        strikePrice: strike.strikePrice,
        isATM: strike.strikePrice === atmStrikePrice,
        
        // CE data
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
        ceDelta: parseFloat(ceGreeks.delta.toFixed(4)),
        ceGamma: parseFloat(ceGreeks.gamma.toFixed(4)),
        ceVega: parseFloat(ceGreeks.vega.toFixed(4)),
        
        // PE data
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
        peDelta: parseFloat(peGreeks.delta.toFixed(4)),
        peGamma: parseFloat(peGreeks.gamma.toFixed(4)),
        peVega: parseFloat(peGreeks.vega.toFixed(4)),
      };
    });
    
    // Calculate PCR
    const pcr = calculatePCR(filteredStrikes);
    
    // Store current data in cache
    await redisCache.store(upperSymbol, expiry, {
      strikes: filteredStrikes,
      timestamp: Date.now(),
    });
    
    res.json({
      symbol: upperSymbol,
      expiry,
      spotPrice: parseFloat(spotPrice.toFixed(2)),
      atmStrike: atmStrikePrice,
      pcr,
      strikes: enrichedStrikes,
      timestamp: Date.now(),
      source: isRealData ? 'dhan' : 'mock',
    });
  } catch (error) {
    console.error('Error fetching option chain:', error);
    res.status(500).json({ 
      error: 'Failed to fetch option chain',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /market/polling/start
 * Start real-time polling for a symbol+expiry combination
 */
router.post('/polling/start', (req: AuthRequest, res: Response) => {
  const { symbol, expiry, interval = 2000 } = req.body;

  if (!symbol || !expiry) {
    return res.status(400).json({ error: 'Symbol and expiry are required' });
  }

  try {
    marketDataPoller.startPolling(symbol.toUpperCase(), expiry, interval);
    res.json({ 
      success: true, 
      message: `Started polling for ${symbol} ${expiry}`,
      interval 
    });
  } catch (error) {
    console.error('Error starting polling:', error);
    res.status(500).json({ 
      error: 'Failed to start polling',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /market/polling/stop
 * Stop real-time polling for a symbol+expiry combination
 */
router.post('/polling/stop', (req: AuthRequest, res: Response) => {
  const { symbol, expiry } = req.body;

  if (!symbol || !expiry) {
    return res.status(400).json({ error: 'Symbol and expiry are required' });
  }

  try {
    marketDataPoller.stopPolling(symbol.toUpperCase(), expiry);
    res.json({ 
      success: true, 
      message: `Stopped polling for ${symbol} ${expiry}` 
    });
  } catch (error) {
    console.error('Error stopping polling:', error);
    res.status(500).json({ 
      error: 'Failed to stop polling',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /market/polling/status
 * Get status of active polls
 */
router.get('/polling/status', (req: AuthRequest, res: Response) => {
  try {
    const activePolls = marketDataPoller.getActivePolls();
    res.json({ 
      activePolls,
      count: activePolls.length 
    });
  } catch (error) {
    console.error('Error getting polling status:', error);
    res.status(500).json({ 
      error: 'Failed to get polling status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /market/previous-session/:symbol
 * Get previous session High, Low, Close for pivot calculations
 */
router.get('/previous-session/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();

    // For now, we'll use mock data based on current spot price
    // In production, this should fetch from historical database or API
    const dhanClient = getDhanStream();
    const spotPrice = await dhanClient.getSpotPrice(upperSymbol);
    
    // Mock previous session data (approximately 1% range from spot)
    const mockHigh = spotPrice * 1.012;
    const mockLow = spotPrice * 0.988;
    const mockClose = spotPrice * 0.998;

    res.json({
      symbol: upperSymbol,
      previousSession: {
        high: mockHigh,
        low: mockLow,
        close: mockClose,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      note: 'Using mock data. Connect to historical data source for production.',
    });
  } catch (error) {
    console.error('Error fetching previous session data:', error);
    
    // Fallback to mock data
    const fallbackPrice = 19650; // NIFTY approximate
    res.json({
      symbol: req.params.symbol.toUpperCase(),
      previousSession: {
        high: fallbackPrice * 1.012,
        low: fallbackPrice * 0.988,
        close: fallbackPrice * 0.998,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      note: 'Using fallback mock data',
    });
  }
});

export default router;
