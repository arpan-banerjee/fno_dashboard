/**
 * Mood Index Calculator Service
 * Analyzes OHLC candles to determine market mood (Bull/Bear/Neutral percentages)
 */

export interface OHLCCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
  volume?: number;
}

export interface MoodIndex {
  bull: number;
  bear: number;
  neutral: number;
  timestamp: number;
}

export type CandleType = 'bull' | 'bear' | 'neutral';

class MoodCalculatorService {
  private smoothingFactor: number = 0.3; // Alpha for EMA smoothing
  private previousMood: MoodIndex | null = null;
  private candleCount: number = 50; // Number of candles to analyze

  /**
   * Classify a single candle as Bull, Bear, or Neutral
   */
  private classifyCandle(candle: OHLCCandle): CandleType {
    if (candle.close > candle.open) {
      return 'bull';
    } else if (candle.close < candle.open) {
      return 'bear';
    } else {
      return 'neutral';
    }
  }

  /**
   * Calculate raw mood percentages from candles
   */
  private calculateRawMood(candles: OHLCCandle[]): MoodIndex {
    // Take last N candles
    const recentCandles = candles.slice(-this.candleCount);
    
    // Count each type
    let bulls = 0;
    let bears = 0;
    let neutrals = 0;

    recentCandles.forEach(candle => {
      const type = this.classifyCandle(candle);
      if (type === 'bull') bulls++;
      else if (type === 'bear') bears++;
      else neutrals++;
    });

    const total = bulls + bears + neutrals;

    // Calculate percentages
    const bullPercent = total > 0 ? (bulls / total) * 100 : 0;
    const bearPercent = total > 0 ? (bears / total) * 100 : 0;
    const neutralPercent = total > 0 ? (neutrals / total) * 100 : 0;

    return {
      bull: Number(bullPercent.toFixed(1)),
      bear: Number(bearPercent.toFixed(1)),
      neutral: Number(neutralPercent.toFixed(1)),
      timestamp: Date.now(),
    };
  }

  /**
   * Apply EMA smoothing to mood values
   */
  private smoothMood(rawMood: MoodIndex): MoodIndex {
    if (!this.previousMood) {
      this.previousMood = rawMood;
      return rawMood;
    }

    const alpha = this.smoothingFactor;
    
    const smoothedMood: MoodIndex = {
      bull: Number((this.previousMood.bull + alpha * (rawMood.bull - this.previousMood.bull)).toFixed(1)),
      bear: Number((this.previousMood.bear + alpha * (rawMood.bear - this.previousMood.bear)).toFixed(1)),
      neutral: Number((this.previousMood.neutral + alpha * (rawMood.neutral - this.previousMood.neutral)).toFixed(1)),
      timestamp: rawMood.timestamp,
    };

    this.previousMood = smoothedMood;
    return smoothedMood;
  }

  /**
   * Calculate mood index from OHLC candles with optional smoothing
   */
  calculateMood(candles: OHLCCandle[], useSmoothing: boolean = true): MoodIndex {
    if (!candles || candles.length === 0) {
      return { bull: 0, bear: 0, neutral: 0, timestamp: Date.now() };
    }

    const rawMood = this.calculateRawMood(candles);

    if (useSmoothing) {
      return this.smoothMood(rawMood);
    }

    return rawMood;
  }

  /**
   * Set the number of candles to analyze
   */
  setCandleCount(count: number): void {
    this.candleCount = Math.max(10, Math.min(200, count)); // Between 10 and 200
  }

  /**
   * Set the smoothing factor (0-1)
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * Reset smoothing state
   */
  resetSmoothing(): void {
    this.previousMood = null;
  }
}

export const moodCalculator = new MoodCalculatorService();
