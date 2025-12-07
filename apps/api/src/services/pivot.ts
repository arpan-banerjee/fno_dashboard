import { PivotLevels, calculateClassicPivot } from '@option-dashboard/shared';

/**
 * Mock OHLC data for different indices
 */
const mockOHLC: Record<string, { high: number; low: number; close: number }> = {
  nifty50: { high: 19750, low: 19550, close: 19650 },
  banknifty: { high: 44400, low: 44000, close: 44200 },
  finnifty: { high: 19950, low: 19650, close: 19800 },
  midcapnifty: { high: 9600, low: 9400, close: 9500 },
  sensex: { high: 65800, low: 65000, close: 65400 },
  bankex: { high: 52600, low: 52000, close: 52300 },
};

/**
 * Get pivot levels for specified index
 */
export async function getPivotLevels(index: string): Promise<PivotLevels> {
  const ohlc = mockOHLC[index] || mockOHLC.nifty50;
  return calculateClassicPivot(ohlc);
}
