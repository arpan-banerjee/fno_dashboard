import { TickData, OISpurt } from '@option-dashboard/shared';

interface Subscription {
  callback: (tick: TickData) => void;
  unsubscribe: () => void;
}

/**
 * Mock stream that simulates real-time market data
 */
export function getMockStream() {
  const subscribers: Set<(tick: TickData) => void> = new Set();
  let intervalId: NodeJS.Timeout | null = null;

  // Start streaming when first subscriber connects
  function startStream() {
    if (intervalId) return;

    intervalId = setInterval(() => {
      const tick = generateMockTick();
      subscribers.forEach(callback => callback(tick));
      
      // Occasionally generate OI spurt
      if (Math.random() < 0.05) {
        const spurtTick = generateOISpurt();
        subscribers.forEach(callback => callback(spurtTick));
      }
    }, 1000); // Emit every second
  }

  // Stop streaming when no subscribers
  function stopStream() {
    if (intervalId && subscribers.size === 0) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    subscribe(callback: (tick: TickData) => void): Subscription {
      subscribers.add(callback);
      startStream();

      return {
        callback,
        unsubscribe: () => {
          subscribers.delete(callback);
          stopStream();
        },
      };
    },
  };
}

/**
 * Generate mock tick data
 */
function generateMockTick(): TickData {
  const symbols = [
    'NIFTY50',
    'BANKNIFTY',
    'NIFTY50-19600-CE',
    'NIFTY50-19600-PE',
    'NIFTY50-19650-CE',
    'NIFTY50-19650-PE',
    'BANKNIFTY-44200-CE',
    'BANKNIFTY-44200-PE',
  ];

  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const isIndex = !symbol.includes('-');

  return {
    symbol,
    ltp: isIndex ? 19650 + (Math.random() - 0.5) * 100 : 100 + (Math.random() - 0.5) * 20,
    volume: Math.floor(10000 + Math.random() * 50000),
    oi: isIndex ? undefined : Math.floor(50000 + Math.random() * 100000),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate OI spurt event (≥ 9.5% change)
 */
function generateOISpurt(): TickData {
  const strikes = ['19600-CE', '19650-PE', '44200-CE'];
  const strike = strikes[Math.floor(Math.random() * strikes.length)];

  return {
    symbol: `NIFTY50-${strike}`,
    ltp: 150 + (Math.random() - 0.5) * 30,
    volume: Math.floor(80000 + Math.random() * 50000),
    oi: Math.floor(200000 + Math.random() * 100000), // Large OI for spurt
    timestamp: new Date().toISOString(),
  };
}
