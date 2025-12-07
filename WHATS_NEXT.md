# What's Next - Implementation Roadmap

## ✅ Completed (Row 5 + Row 6)

- Backend cache system for historical data
- IVDEX endpoint with trend arrows
- Option chain endpoint with advanced color logic
- Frontend hooks (useIVDEX, useOptionChain)
- OptionChainHeader component (Row 5)
- OptionChainTable component (Row 6)
- 17-column table structure
- Advanced color coding (8 scenarios)
- ATM strike highlighting
- Built-up classification
- Fade animations for decreasing OI
- Integration with DashboardPage

---

## 🔄 Pending Improvements

### 1. Real Dhan API Integration

#### Current Status
- ✅ Spot price: Working with Dhan API (fallback to mock)
- ⚠️ IVDEX: Using mock data
- ⚠️ Option chain: Using mock data
- ⚠️ Bid/Ask/Qty: Using placeholder values

#### Implementation Steps

**IVDEX Endpoint** (`/market/ivdex/:symbol`):
```typescript
// Replace mock calculation with:
const ivdexResponse = await fetch(
  `https://api.dhan.co/v2/market/ivindex/${symbol}`,
  { headers: { 'Authorization': `Bearer ${DHAN_ACCESS_TOKEN}` }}
);
const { current, previous } = await ivdexResponse.json();
```

**Option Chain Endpoint** (`/market/option-chain/:symbol/:expiry`):
```typescript
// Replace mock strike generation with:
const chainResponse = await fetch(
  `https://api.dhan.co/v2/market/option-chain?symbol=${symbol}&expiry=${expiry}`,
  { headers: { 'Authorization': `Bearer ${DHAN_ACCESS_TOKEN}` }}
);
const strikes = await chainResponse.json();
```

**Bid/Ask Data**:
```typescript
// Fetch real bid/ask/qty from Dhan market depth API
const depthResponse = await fetch(
  `https://api.dhan.co/v2/market/depth/${instrumentToken}`,
  { headers: { 'Authorization': `Bearer ${DHAN_ACCESS_TOKEN}` }}
);
```

---

### 2. TV (Time Value) and IV (Implied Volatility) Calculation

#### Current Status
- ⚠️ TV: Placeholder values (45.2, 18.5, etc.)
- ⚠️ IV: Mock values (15 + random)

#### Implementation

**Time Value (TV)**:
```typescript
// TV = Option Premium - Intrinsic Value
// Intrinsic Value (CE) = max(0, Spot - Strike)
// Intrinsic Value (PE) = max(0, Strike - Spot)

function calculateTV(
  optionPremium: number, 
  spotPrice: number, 
  strikePrice: number, 
  optionType: 'CE' | 'PE'
): number {
  let intrinsicValue = 0;
  
  if (optionType === 'CE') {
    intrinsicValue = Math.max(0, spotPrice - strikePrice);
  } else {
    intrinsicValue = Math.max(0, strikePrice - spotPrice);
  }
  
  return Math.max(0, optionPremium - intrinsicValue);
}
```

**Implied Volatility (IV)**:
```typescript
// Option 1: Fetch from Dhan API if available
// Option 2: Calculate using Black-Scholes formula (Newton-Raphson method)

import { blackScholes, impliedVolatility } from '@option-dashboard/shared';

function calculateIV(
  optionPrice: number,
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number, // in years
  riskFreeRate: number, // typically 6.5% in India
  optionType: 'call' | 'put'
): number {
  return impliedVolatility(
    optionPrice,
    spotPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    optionType
  );
}
```

**Time to Expiry Calculation**:
```typescript
function getTimeToExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays / 365; // Convert to years
}
```

---

### 3. WebSocket Integration for Real-Time Updates

#### Current Status
- ⚠️ Polling every 5-10 seconds (REST API)

#### Recommended Approach
```typescript
// apps/web/src/hooks/useOptionChainWebSocket.ts

import { useEffect, useState } from 'react';

export function useOptionChainWebSocket(symbol: string, expiry: string) {
  const [data, setData] = useState<OptionChainData | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000/stream/option-chain');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ 
        action: 'subscribe', 
        symbol, 
        expiry 
      }));
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setData(update);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [symbol, expiry]);

  return { data };
}
```

**Backend WebSocket Server**:
```typescript
// apps/api/src/routes/stream.ts (extend existing)

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { action, symbol, expiry } = JSON.parse(message);
    
    if (action === 'subscribe') {
      // Subscribe to Dhan WebSocket
      const dhanWs = await getDhanStream();
      
      dhanWs.on('option-chain-update', (data) => {
        // Process and enrich data
        const enrichedData = processOptionChain(data);
        ws.send(JSON.stringify(enrichedData));
      });
    }
  });
});
```

---

### 4. Performance Optimization

#### Memoization
```typescript
// Memoize color calculations
const memoizedVolumeColor = useMemo(
  () => calculateVolumeColor(volume, previousVolume, highestVolume, isCE),
  [volume, previousVolume, highestVolume, isCE]
);

// Memoize strike filtering
const memoizedStrikes = useMemo(
  () => filterStrikeRange(allStrikes, spotPrice),
  [allStrikes, spotPrice]
);
```

#### Virtual Scrolling
```typescript
// Install react-window
npm install react-window @types/react-window

// Use FixedSizeList for large datasets
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={strikes.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <OptionStrikeRow strike={strikes[index]} />
    </div>
  )}
</FixedSizeList>
```

---

### 5. Additional Features

#### Export to CSV/Excel
```typescript
// Install xlsx
npm install xlsx @types/xlsx

import * as XLSX from 'xlsx';

function exportToExcel(data: OptionChainData) {
  const worksheet = XLSX.utils.json_to_sheet(data.strikes);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Option Chain');
  XLSX.writeFile(workbook, `${data.symbol}_${data.expiry}_option_chain.xlsx`);
}
```

#### Historical Comparison UI
```typescript
// Show previous 3 snapshots side-by-side
<Box sx={{ display: 'flex', gap: 2 }}>
  {historicalData.map((snapshot, index) => (
    <Box key={index}>
      <Typography variant="caption">
        {new Date(snapshot.timestamp).toLocaleTimeString()}
      </Typography>
      <Typography variant="h6">
        OI: {snapshot.totalOI.toLocaleString()}
      </Typography>
    </Box>
  ))}
</Box>
```

#### Chart Overlays
```typescript
// Install recharts
npm install recharts

import { LineChart, Line, XAxis, YAxis } from 'recharts';

<LineChart data={volumeHistory}>
  <XAxis dataKey="time" />
  <YAxis />
  <Line type="monotone" dataKey="ceVolume" stroke="#4caf50" />
  <Line type="monotone" dataKey="peVolume" stroke="#f44336" />
</LineChart>
```

#### Strike Filtering
```typescript
// Add filter dropdown
<Select value={strikeFilter} onChange={(e) => setStrikeFilter(e.target.value)}>
  <MenuItem value="all">All Strikes</MenuItem>
  <MenuItem value="itm">ITM (In-The-Money)</MenuItem>
  <MenuItem value="atm">ATM (At-The-Money)</MenuItem>
  <MenuItem value="otm">OTM (Out-of-The-Money)</MenuItem>
  <MenuItem value="range">Custom Range</MenuItem>
</Select>

// Filter logic
const filteredStrikes = strikes.filter((strike) => {
  switch (strikeFilter) {
    case 'itm': return strike.strikePrice < spotPrice; // CE ITM
    case 'atm': return Math.abs(strike.strikePrice - spotPrice) < 100;
    case 'otm': return strike.strikePrice > spotPrice;
    default: return true;
  }
});
```

---

### 6. Redis Cache Implementation

#### Current Status
- ✅ In-memory Map (works for single-server)
- ⚠️ Not suitable for multi-server deployment

#### Upgrade to Redis
```typescript
// Install redis
npm install redis @types/redis

// apps/api/src/cache/redisCache.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

await redisClient.connect();

export async function storeOptionChain(
  symbol: string, 
  expiry: string, 
  data: any
) {
  const key = `optionchain:${symbol}:${expiry}`;
  const snapshots = await redisClient.lRange(key, 0, -1);
  
  // Keep only last 3 snapshots
  if (snapshots.length >= 3) {
    await redisClient.lPop(key);
  }
  
  await redisClient.rPush(key, JSON.stringify({
    timestamp: Date.now(),
    data
  }));
  
  // Expire after 1 hour
  await redisClient.expire(key, 3600);
}

export async function getPreviousOptionChain(
  symbol: string, 
  expiry: string
) {
  const key = `optionchain:${symbol}:${expiry}`;
  const snapshots = await redisClient.lRange(key, 0, -1);
  
  if (snapshots.length >= 2) {
    return JSON.parse(snapshots[snapshots.length - 2]);
  }
  
  return null;
}
```

---

### 7. Testing

#### Unit Tests
```typescript
// apps/api/src/utils/__tests__/optionChain.utils.test.ts

import { 
  calculateBuiltUp, 
  calculateVolumeColor, 
  findATMStrike 
} from '../optionChain.utils';

describe('Option Chain Utils', () => {
  test('calculateBuiltUp - Long Build-up', () => {
    const result = calculateBuiltUp(1000, 10);
    expect(result.classification).toBe('LB');
    expect(result.color).toBe('#4caf50');
  });

  test('calculateVolumeColor - Highest CE Volume', () => {
    const color = calculateVolumeColor(10000, 5000, 10000, true);
    expect(color).toBe('#4caf50');
  });

  test('findATMStrike - Closest to spot', () => {
    const strikes = [
      { strikePrice: 19500, /* ... */ },
      { strikePrice: 19550, /* ... */ },
      { strikePrice: 19600, /* ... */ },
    ];
    const atm = findATMStrike(strikes, 19575);
    expect(atm).toBe(19600);
  });
});
```

#### Integration Tests
```typescript
// apps/api/src/routes/__tests__/market.test.ts

import request from 'supertest';
import app from '../../index';

describe('Market API', () => {
  test('GET /market/ivdex/NIFTY', async () => {
    const response = await request(app)
      .get('/market/ivdex/NIFTY')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('currentIV');
    expect(response.body).toHaveProperty('trend');
  });

  test('GET /market/option-chain/NIFTY/2025-01-30', async () => {
    const response = await request(app)
      .get('/market/option-chain/NIFTY/2025-01-30')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.strikes).toHaveLength(31);
  });
});
```

#### E2E Tests
```typescript
// apps/web/e2e/optionChain.spec.ts (Playwright)

import { test, expect } from '@playwright/test';

test('Option Chain displays correctly', async ({ page }) => {
  await page.goto('http://localhost:3001/dashboard');
  
  // Login
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Select expiry
  await page.selectOption('select', '2025-01-30');
  
  // Wait for option chain to load
  await expect(page.locator('text=Loading Option Chain')).toBeHidden();
  
  // Check if ATM strike is highlighted
  const atmStrike = page.locator('[data-is-atm="true"]');
  await expect(atmStrike).toHaveCSS('border-bottom', '3px solid #FFD700');
  
  // Check if CE header is green
  const ceHeader = page.locator('text=CE (CALL)');
  await expect(ceHeader).toHaveCSS('background-color', '#4caf50');
});
```

---

## 🎯 Recommended Priority

1. **Phase 1 (Critical)**:
   - Real Dhan API integration (IVDEX + Option Chain)
   - TV and IV calculations
   - Bug fixes and stability improvements

2. **Phase 2 (Important)**:
   - WebSocket integration for real-time updates
   - Redis cache for multi-server support
   - Performance optimization (memoization, virtual scrolling)

3. **Phase 3 (Nice to Have)**:
   - Export to Excel
   - Historical comparison UI
   - Chart overlays
   - Advanced filtering
   - Unit/Integration/E2E tests

---

## 📊 Current Application Status

- ✅ Backend API: Running on port 4000
- ✅ Frontend Web: Running on http://localhost:3001/
- ✅ Row 1-4: Fully functional
- ✅ Row 5-6: Implemented with mock data
- ⚠️ Dhan API: Spot price working, others pending
- ⚠️ Cache: In-memory (works for development)
- ⚠️ Real-time: Polling (5-10s interval)

---

## 🔗 Useful Links

- **Dhan API Docs**: https://api.dhan.co/docs
- **Material-UI**: https://mui.com/material-ui/
- **TanStack Query**: https://tanstack.com/query/latest
- **React Window**: https://react-window.vercel.app/
- **XLSX**: https://docs.sheetjs.com/
- **Recharts**: https://recharts.org/
- **Playwright**: https://playwright.dev/

---

## 📝 Notes

- Dhan access token expires on **January 27, 2026**
- Current implementation uses **mock data** for IVDEX and option chain
- Color logic is **fully implemented** and ready for real data
- Cache system is **operational** but in-memory only
- All TypeScript types are **defined and validated**
