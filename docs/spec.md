# Option Buyers' Dashboard - Complete Specification

## Overview

Full-featured options trading dashboard with real-time streaming, Greeks calculations, built-up analysis, admin management, and JWT authentication.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Material-UI
- Backend: Node.js + Express + TypeScript
- Database: JSON file-based storage
- Streaming: WebSocket (Dhan API or mock)
- State Management: Zustand
- Data Fetching: React Query

---

## Architecture

### Monorepo Structure

```
apps/
  api/         - Backend REST API + WebSocket server
  web/         - Frontend React SPA
packages/
  shared/      - Shared TypeScript types, formulas, utilities
```

### Communication Flow

```
User → React App → REST API → JSON DB
                 ↓
                WebSocket ← Dhan API / Mock Stream
```

---

## Features & Requirements

### 1. User Interface (29 Rows)

#### Row 1: Header (Sticky)
- **Content**: "OPTION BUYER's DASHBOARD" (centered, bold)
- **Position**: Fixed at top
- **Z-index**: 1100

#### Row 2: Golden Subheader (Sticky)
- **Content**: "PRIMEXA Learning Series WhatsApp 9836001579" (centered)
- **Right Side**: Admin button (superadmin only), Refresh, Logout
- **Background**: Gold (#FFD700)
- **Position**: Sticky below header
- **Z-index**: 1099

#### Row 3: Dynamic Numbers Bar (Sticky)
- **Data**: Pivot, S1, S2, R1, R2 (calculated from OHLC)
- **Frequency Selector**: 1m, 3m, 5m, 10m, 15m, 30m, 1hr
- **Auto-refresh Toggle**: Enable/disable automatic data refresh
- **Mood Index Bar**: Bull%, Neutral%, Bear% (visual bar chart)
- **Next Update Timer**: Countdown to next refresh
- **OI Spurt Indicator**: Visible when any strike has ≥9.5% OI change
- **Position**: Sticky below subheader
- **Z-index**: 1098

#### Row 4: TabBar (Scrollable)
- **Tabs**: nifty50, banknifty, finnifty, midcapnifty, sensex, bankex, fno, IV, monthly range, weekly range, daily range
- **Each Tab (except fno)**: Shows current spot price + dropdown (▾) for expiry selection
- **Horizontal Scroll**: Enabled for mobile
- **Behavior**: Click tab → fetch option chain for selected index

#### Row 5: CE/PE Title Bar (Scrollable)
- **Layout**: 3 columns
  - Left (50%): "CE" (green background, white text)
  - Center: Instrument name + spot price
  - Right (50%): "PE" (red background, white text)

#### Rows 6–22: Option Chain Grid (17 Rows, Scrollable)
- **Structure**: Mirror layout (CE | Strike/PCR | PE)
- **CE Columns (left to right)**:
  1. Built up tag
  2. Volume
  3. Delta
  4. OI
  5. OI Chg
  6. OI Chg%
  7. LTP (top) / LTP Chg (bottom)
  8. IV (top) / TVitm (bottom)
- **Center Column**:
  - Strike (top)
  - PCR (bottom)
- **PE Columns (right to left)**: Same as CE, mirrored
- **Text Color**: White on dark background
- **Spot Strike**: Gold underline, moves with spot changes
- **Hidden Scrollbar**: CSS `scrollbar-width: none`, but scrollable

#### Row 23: Spacer (Optional)
- Flexible space for viewport adjustment

#### Row 24: Summary Stats
- **Boxes**: Vol CE, Vol PE, Total Vol, Call OI, Put OI, Total OI, PCR, Alpha, Beta, Gamma, Delta, Rho
- **Layout**: Horizontal grid, responsive

#### Rows 25–28: Targets
- **Timeframes**: Daily, Weekly, Monthly
- **Each Timeframe**:
  - Bullish: 1st, 2nd, 3rd (green text)
  - Bearish: 1st, 2nd, 3rd (red text)
- **Formula**: C ± [1.0R, 1.5R, 2.0R] (configurable multipliers)

#### Row 29: Footer Warning (Sticky Bottom)
- **Content**: "warning – This dashboard is for learning and research purpose"
- **Background**: Gold
- **Text Color**: Black
- **Position**: Fixed at bottom
- **Z-index**: 1100

---

### 2. Highlight & Color Logic

| Condition | Highlight Color | Target |
|-----------|----------------|--------|
| Highest CE Volume | Bright Green (#00E676) | Entire row |
| Highest PE Volume | Bright Red (#FF1744) | Entire row |
| Highest CE OI | Bright Green (#00E676) | Entire row |
| Highest PE OI | Bright Red (#FF1744) | Entire row |
| CE OI% > 60% increase | Light Green (#C5E1A5) | OI cell |
| PE OI% > 60% increase | Pink (#F48FB1) | OI cell |
| OI% > 60% decrease | Yellow (#FFEB3B) | OI cell |
| OI Spurt ≥ +9.5% | Yellow (#FFEB3B) | Entire row |
| LTP Change positive | Green text | LTP Chg cell |
| LTP Change negative | Red text | LTP Chg cell |
| Spot Strike | Gold underline | Strike row |

**Note**: Config toggle for decreasing OI threshold (>60% or <60%)

---

### 3. Data & Calculations

#### VIX-Based Market Range

**Formula**:
```
v = V / 100
t = sqrt(D / 365)
R = C × v × t

Upper = C + R
Lower = C - R
Upside Target = C + 3R
Downside Target = C - 3R
```

**Time Factors**:
- Daily (D=1): t = 0.0523
- Weekly (D=7): t = 0.1171
- Monthly (D=30): t = 0.2867

**Inputs**:
- C: Current spot price
- V: VIX value (manual input or API)

#### Pivot Points (Classic)

**Formula**:
```
Pivot = (H + L + C) / 3
R1 = 2 × Pivot - L
S1 = 2 × Pivot - H
R2 = Pivot + (H - L)
S2 = Pivot - (H - L)
```

**Alternative Methods** (configurable):
- Fibonacci: R1 = Pivot + 0.382×(H-L), R2 = Pivot + 0.618×(H-L)
- Camarilla: R1 = C + 1.1×(H-L)/12, R2 = C + 1.1×(H-L)/6

#### Greeks (Black-Scholes)

**Formulas**:
```
d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
d2 = d1 - σ√T

Delta (Call): N(d1)
Delta (Put): N(d1) - 1

Gamma: N'(d1) / (S σ √T)

Theta (Call): -(S N'(d1) σ)/(2√T) - r K e^(-rT) N(d2)
Theta (Put): -(S N'(d1) σ)/(2√T) + r K e^(-rT) N(-d2)

Vega: S N'(d1) √T

Rho (Call): K T e^(-rT) N(d2)
Rho (Put): -K T e^(-rT) N(-d2)
```

**Inputs**:
- S: Spot price
- K: Strike price
- r: Risk-free rate (default: 0.05)
- σ: Implied Volatility (IV)
- T: Time to expiry (years)
- N(x): Cumulative standard normal distribution
- N'(x): Standard normal PDF

#### PCR (Put-Call Ratio)

**Formula**:
```
Global PCR = Total Put OI / Total Call OI
Strike PCR = PE OI / CE OI
```

**Interpretation**:
- PCR > 1: Bearish sentiment
- PCR < 1: Bullish sentiment
- PCR = 1: Neutral

#### Built-Up Classification

**Rules**:
| Price Change | OI Change | Classification |
|--------------|-----------|----------------|
| ↑ | ↑ | Long Built Up |
| ↑ | ↓ | Short Cover |
| ↓ | ↑ | Short Built Up |
| ↓ | ↓ | Long Unwind |

**Thresholds**: Configurable (default: any change > 0%)

#### Deep ITM Approximations

**Formulas**:
```
Call ≈ S - K e^(-rT)
Put ≈ K e^(-rT) - S
```

#### Time Value (ITM/OTM)

**Formula**:
```
TVitm = LTP - Intrinsic Value

Intrinsic Value (Call) = max(0, S - K)
Intrinsic Value (Put) = max(0, K - S)
```

---

### 4. Authentication & Authorization

#### JWT Authentication

- **Token Generation**: HS256, expires in 7 days
- **Payload**: `{ userId, email, role, device_id }`
- **Storage**: localStorage (client-side)
- **Header**: `Authorization: Bearer <token>`

#### User Roles

| Role | Permissions |
|------|-------------|
| `superadmin` | Full access, view Admin dashboard, manage all users |
| `admin` | View Admin dashboard, manage users (limited) |
| `user` | View market data dashboard only |

#### Device Management

| Role | Device Limit | SMS Verification |
|------|--------------|------------------|
| `user` (free) | 1 | Yes (if exceeded) |
| `user` (paid) | 2 | Yes (if exceeded) |
| `superadmin` | 4 | Yes (if exceeded) |

**Flow**:
1. User logs in with `device_fingerprint`
2. Check if device exists in `user.devices`
3. If new device + limit exceeded → require SMS verification
4. If verified → add device to `user.devices`

#### Plans & Expiry

| Plan Type | Duration | Price | Status |
|-----------|----------|-------|--------|
| Free Trial | 30 days | ₹0 | `free` |
| Paid (90 days) | 90 days | ₹999 | `paid` |
| Paid (180 days) | 180 days | ₹1799 | `paid` |
| Paid (365 days) | 365 days | ₹2999 | `paid` |

**Expiry Handling**:
- On login, check `lastPlan.end` < now
- If expired and unpaid → redirect to `/paid-plan`
- If expired but new plan purchased → update `status` to `paid`

---

### 5. API Endpoints

See [api.md](./api.md) for complete documentation.

**Summary**:
- **Auth**: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/verify-sms`
- **Admin**: `/admin/counters`, `/admin/settings`, `/admin/users`, `/admin/logs`
- **Market**: `/market/indices`, `/market/option-chain`, `/market/summary`, `/market/ranges`, `/market/pivot`
- **Streaming**: `ws://localhost:4000/stream/ticks`

---

### 6. Database Schema (JSON)

#### users.json
```json
[
  {
    "id": "uuid",
    "name": "Primexa Admin",
    "email": "primexa1967@gmail.com",
    "mobile": "9836001579",
    "password_hash": "bcrypt_hash",
    "role": "superadmin",
    "plans": [
      {
        "type": "paid_365",
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2025-01-01T00:00:00.000Z"
      }
    ],
    "devices": [
      {
        "device_id": "device_123",
        "added_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "status": "paid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### settings.json
```json
{
  "freeTrialDays": 30,
  "planRates": {
    "paid_90": 999,
    "paid_180": 1799,
    "paid_365": 2999
  },
  "paymentLink": "https://payment.example.com",
  "qrImageUrl": "/images/payment-qr.png",
  "taxPercent": 18,
  "oiChangeThreshold": 60,
  "oiSpurtThreshold": 9.5
}
```

#### payments.json
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "amount": 999,
    "planType": "paid_90",
    "paymentDate": "2024-01-01T00:00:00.000Z",
    "status": "completed",
    "transactionId": "txn_123"
  }
]
```

#### logs.json
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "adminId": "uuid",
    "action": "update_settings",
    "details": { ... }
  }
]
```

---

### 7. Streaming Data

#### Dhan API Integration

**Endpoints** (placeholder):
- REST: Instrument master, OHLC, option chain
- WebSocket: Real-time ticks

**Configuration**:
```
DHAN_API_KEY=<your_key>
DHAN_ACCESS_TOKEN=<your_token>
DHAN_CLIENT_ID=<optional>
```

#### Mock Stream

**Behavior**:
- Generates tick every 1 second
- Simulates spot price changes (±50 points)
- Generates option LTP/Volume/OI changes
- Occasionally triggers OI Spurt (≥9.5% change)
- Used when `MOCK_MODE=true` or credentials missing

---

### 8. Testing

#### Unit Tests

**Shared Package** (`packages/shared/src/__tests__/`):
- `vix.test.ts`: VIX range calculations
- `greeks.test.ts`: Black-Scholes Greeks (placeholder)
- `pivot.test.ts`: Classic, Fibonacci, Camarilla pivots
- `builtUp.test.ts`: Built-up classifier
- `pcr.test.ts`: PCR calculator

**API** (`apps/api/src/__tests__/`):
- Auth endpoints: register, login, device management
- Admin endpoints: counters, settings, users, logs
- Business logic: user expiry, plan updates

**Web** (`apps/web/src/__tests__/`):
- Component rendering: OptionBlock, HeaderBar
- Highlight logic: Volume/OI peaks, OI changes
- Store: Auth, Market state management

**Coverage Target**: 70%+

#### Test Commands

```bash
npm test                                # All tests
npm test --workspace=packages/shared    # Formulas
npm test --workspace=apps/api           # API
npm test --workspace=apps/web           # UI
```

---

### 9. CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):
1. Setup Node.js (matrix: 18.x, 20.x)
2. Install dependencies
3. Build shared package
4. Run lint
5. Run tests (all workspaces)
6. Build API + Web
7. Security audit (npm audit)

**Triggers**:
- Push to `main`, `develop`
- Pull requests

---

### 10. Deployment

#### Development

```bash
npm install
npm run build --workspace=packages/shared
npm run dev:api    # Terminal 1
npm run dev:web    # Terminal 2
```

#### Production

```bash
npm run build
cd apps/api && npm start
cd apps/web && npm run preview  # or deploy dist/ to CDN
```

---

## Acceptance Criteria

✅ Dashboard renders 29 rows with sticky/scroll behavior
✅ 17-strike option chain with CE/PE mirror layout
✅ Real-time streaming (mock or Dhan API)
✅ Highlight logic: Volume/OI peaks, OI changes, OI Spurt
✅ Greeks, VIX ranges, Pivots calculated correctly
✅ Built-up classification with color-coded tags
✅ Admin dashboard: counters, user management, settings, logs
✅ JWT auth with device management and plan expiry
✅ Responsive design (desktop, tablet, mobile landscape)
✅ Unit tests pass with 70%+ coverage
✅ CI pipeline passes on clean clone

---

## Known Limitations & Future Enhancements

### Current Limitations
- Dhan API integration is placeholder (requires actual implementation)
- SMS verification is stubbed (always succeeds in dev)
- JSON DB (not scalable for production; consider PostgreSQL/MongoDB)
- No real-time collaboration (single-user focus)

### Future Enhancements
1. Real Dhan API WebSocket integration
2. PostgreSQL/MongoDB for scalable storage
3. Real SMS gateway integration (Twilio, AWS SNS)
4. Historical data analysis & backtesting
5. Push notifications for OI Spurts
6. Advanced charting (candlesticks, indicators)
7. Multi-language support
8. Dark/Light theme toggle
9. Export to CSV/PDF
10. Alerts & watchlists

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Contact**: primexa1967@gmail.com | WhatsApp: 9836001579
