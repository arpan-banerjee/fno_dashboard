import { Router, Request, Response } from 'express';
import { moodCalculator, OHLCCandle } from '../services/moodCalculator';
import { oiSpurtService, OIData } from '../services/oiSpurtService';

const router = Router();

/**
 * GET /mood/index
 * Get current mood index with optional parameters
 * Query params:
 *   - symbol: NIFTY, BANKNIFTY, etc.
 *   - interval: 1m, 5m, 15m, etc.
 *   - candleCount: number of candles to analyze
 */
router.get('/index', async (req: Request, res: Response) => {
  try {
    const { symbol = 'NIFTY', interval = '5m', candleCount } = req.query;

    // Set candle count if provided
    if (candleCount && typeof candleCount === 'string') {
      moodCalculator.setCandleCount(parseInt(candleCount));
    }

    // TODO: Fetch OHLC data from Dhan API or mock data
    // For now, return mock mood data
    const mockCandles: OHLCCandle[] = generateMockCandles(50);
    const mood = moodCalculator.calculateMood(mockCandles, true);

    res.json({
      symbol,
      interval,
      mood,
      candleCount: mockCandles.length,
    });
  } catch (error) {
    console.error('Error calculating mood index:', error);
    res.status(500).json({ error: 'Failed to calculate mood index' });
  }
});

/**
 * GET /mood/oi-spurt
 * Get current OI spurt alerts
 * Query params:
 *   - symbol: NIFTY, BANKNIFTY, etc.
 */
router.get('/oi-spurt', async (req: Request, res: Response) => {
  try {
    const { symbol = 'NIFTY' } = req.query;

    // TODO: Fetch OI data from Dhan API or mock data
    // For now, return mock OI spurt data
    const mockOIData: OIData[] = generateMockOIData();
    const spurt = oiSpurtService.updateOI(mockOIData);

    res.json({
      symbol,
      spurt: spurt || { active: false, strike: '', percent: 0, timestamp: Date.now(), optionType: 'CE' },
      lastSpurt: oiSpurtService.getLastSpurt(),
    });
  } catch (error) {
    console.error('Error detecting OI spurt:', error);
    res.status(500).json({ error: 'Failed to detect OI spurt' });
  }
});

/**
 * GET /mood/dashboard-data
 * Get all data needed for the dynamic numbers bar
 * Query params:
 *   - symbol: NIFTY, BANKNIFTY, etc.
 *   - interval: 1m, 5m, 15m, etc.
 */
router.get('/dashboard-data', async (req: Request, res: Response) => {
  try {
    const { symbol = 'NIFTY', interval = '5m' } = req.query;

    // Calculate mood
    const mockCandles: OHLCCandle[] = generateMockCandles(50);
    const mood = moodCalculator.calculateMood(mockCandles, true);

    // Check OI spurt
    const mockOIData: OIData[] = generateMockOIData();
    const spurt = oiSpurtService.updateOI(mockOIData);

    // Calculate next update time (based on interval)
    const intervalSeconds = getIntervalSeconds(interval as string);
    const nextUpdate = intervalSeconds;

    res.json({
      symbol,
      interval,
      mood,
      oiSpurt: spurt || { active: false, strike: '', percent: 0, timestamp: Date.now(), optionType: 'CE' },
      nextUpdate,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * Helper: Generate mock OHLC candles for testing
 */
function generateMockCandles(count: number): OHLCCandle[] {
  const candles: OHLCCandle[] = [];
  let basePrice = 23500;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 100;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 20;
    const low = Math.min(open, close) - Math.random() * 20;

    candles.push({
      open,
      high,
      low,
      close,
      timestamp: now - (count - i) * 60000, // 1 minute apart
      volume: Math.floor(Math.random() * 10000),
    });

    basePrice = close;
  }

  return candles;
}

/**
 * Helper: Generate mock OI data for testing
 */
function generateMockOIData(): OIData[] {
  const strikes = [23000, 23100, 23200, 23300, 23400, 23500];
  const data: OIData[] = [];
  const now = Date.now();

  strikes.forEach(strike => {
    // CE option
    data.push({
      strike,
      optionType: 'CE',
      openInterest: Math.floor(50000 + Math.random() * 100000),
      timestamp: now,
    });

    // PE option
    data.push({
      strike,
      optionType: 'PE',
      openInterest: Math.floor(50000 + Math.random() * 100000),
      timestamp: now,
    });
  });

  // Randomly add a spurt to one strike
  if (Math.random() > 0.7) {
    const randomIndex = Math.floor(Math.random() * data.length);
    data[randomIndex].openInterest *= 1.15; // 15% increase
  }

  return data;
}

/**
 * Helper: Get interval in seconds
 */
function getIntervalSeconds(interval: string): number {
  const map: { [key: string]: number } = {
    '1m': 60,
    '3m': 180,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '60m': 3600,
    '1D': 86400,
  };
  return map[interval] || 300;
}

export default router;
