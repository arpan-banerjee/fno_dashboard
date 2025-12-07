# Option Buyers' Dashboard

A comprehensive real-time options trading dashboard built with React, Node.js, and TypeScript. Features streaming market data from Dhan API, advanced Greeks calculations, built-up analysis, and admin management.

## 🚀 Features

- **Real-time Streaming**: Live market data via WebSocket from Dhan API or mock stream
- **17-Strike Option Chain**: Mirror layout (CE/PE) with complete option analytics
- **Advanced Calculations**: Greeks (Black-Scholes), VIX-based ranges, Pivot points
- **Built-Up Analysis**: Long/Short Built Up, Cover, and Unwind classification
- **Highlight Logic**: Volume/OI peaks, OI changes, OI Spurts (≥9.5%)
- **Multi-Index Support**: NIFTY 50, Bank Nifty, Fin Nifty, Midcap, Sensex, Bankex
- **Admin Dashboard**: User management, plan settings, revenue tracking
- **Auth & Plans**: JWT authentication, free trial (30 days), paid plans (90/180/365 days)
- **Device Management**: Track and limit devices per user role
- **Responsive Design**: Works on desktop, tablet, and mobile landscape

## 📁 Project Structure

```
option-buyers-dashboard/
├── apps/
│   ├── api/                 # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/      # Auth, Admin, Market, Stream routes
│   │   │   ├── services/    # Dhan client, Mock stream, Option chain
│   │   │   ├── db/          # JSON database layer
│   │   │   ├── middleware/  # JWT auth middleware
│   │   │   └── index.ts     # Main server file
│   │   ├── storage/         # JSON DB files (users, settings, payments, logs)
│   │   └── package.json
│   │
│   └── web/                 # React + Vite frontend
│       ├── src/
│       │   ├── pages/       # Login, Dashboard, Admin, PaidPlan
│       │   ├── components/  # UI components (HeaderBar, OptionBlock, etc.)
│       │   ├── api/         # API client (auth, market, admin)
│       │   ├── store/       # Zustand state management
│       │   ├── styles/      # MUI theme configuration
│       │   └── main.tsx     # App entry point
│       └── package.json
│
├── packages/
│   └── shared/              # Shared TypeScript utilities
│       ├── src/
│       │   ├── types/       # Type definitions
│       │   ├── formulas/    # VIX, Greeks, Pivot calculations
│       │   ├── logic/       # Built-up classifier
│       │   └── utils/       # PCR calculator
│       └── package.json
│
├── docs/                    # Documentation
│   ├── spec.md             # Requirements specification
│   └── api.md              # API endpoint documentation
│
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI
│
├── package.json            # Root workspace config
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd option-buyers-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   **Backend** (`apps/api/.env`):
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Edit `.env` and set:
   - `JWT_SECRET`: A secure random string
   - `DHAN_API_KEY`, `DHAN_ACCESS_TOKEN`: Your Dhan API credentials (or leave empty for mock mode)
   - `ADMIN_SEED_EMAIL`: Default `primexa1967@gmail.com`
   - `ADMIN_SEED_PASSWORD`: Default `ChangeMe!123` (change in production!)
   - `MOCK_MODE=true`: Set to `false` when using real Dhan API

   **Frontend** (`apps/web/.env`):
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   Edit `.env`:
   - `VITE_API_BASE_URL=http://localhost:4000`
   - `VITE_WS_URL=ws://localhost:4000/stream/ticks`

4. **Build shared package** (required first):
   ```bash
   npm run build --workspace=packages/shared
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend**:
   ```bash
   npm run dev:api
   ```
   API will run on `http://localhost:4000`

2. **Start the frontend** (in a separate terminal):
   ```bash
   npm run dev:web
   ```
   Web app will run on `http://localhost:3000`

3. **Access the app**:
   - Open `http://localhost:3000` in your browser
   - Login with:
     - **Email**: `primexa1967@gmail.com`
     - **Password**: `ChangeMe!123`

### Production Build

```bash
npm run build
```

This builds both API and web apps into their respective `dist` folders.

To start in production:
```bash
# Backend
cd apps/api
npm start

# Frontend (serve with any static server)
cd apps/web
npm run preview
```

## 📚 Usage

### User Features

1. **Login/Register**: Create account with free 30-day trial
2. **Dashboard**: View real-time option chain for selected index
3. **Tab Navigation**: Switch between NIFTY 50, Bank Nifty, etc.
4. **Frequency Selection**: Choose data refresh rate (1m, 5m, 15m, etc.)
5. **Option Chain**: 17 strikes with CE/PE mirror layout
   - Built-up tags (Long/Short Built Up, Cover, Unwind)
   - Volume/OI highlights
   - OI Spurt indicators (≥9.5% change)
6. **Summary Stats**: Total volumes, OI, PCR, Greeks
7. **Targets**: Bullish/Bearish targets for Daily/Weekly/Monthly

### Admin Features

**Access**: Login as superadmin → Click "Admin" button

1. **Dashboard Counters**: Total/Free/Paid/Expired users, revenue
2. **User Management**: Search, filter, update user roles/plans
3. **Settings**: Configure free trial days, plan rates, payment links
4. **Logs**: View recent admin actions

## 🧪 Testing

```bash
# Run all tests
npm test

# Test shared package (formulas)
npm test --workspace=packages/shared

# Test API
npm test --workspace=apps/api

# Test web
npm test --workspace=apps/web
```

### Test Coverage

- **Shared Package**: VIX calculations, Greeks, Pivot points, PCR, Built-up classifier
- **API**: Auth endpoints, admin operations
- **Web**: Component rendering, highlight logic

Target coverage: 70%+

## 🔑 Authentication

- **JWT-based**: Tokens expire after 7 days (configurable)
- **Roles**: `superadmin`, `admin`, `user`
- **Device Management**:
  - Free users: 1 device
  - Paid users: 2 devices
  - Superadmin: 4 devices
  - SMS verification required when limit exceeded (stubbed in dev)

## 💳 Plans & Pricing

Default configuration:
- **Free Trial**: 30 days
- **90-day Plan**: ₹999
- **180-day Plan**: ₹1799
- **365-day Plan**: ₹2999
- **Tax**: 18% (configurable)

Admins can update plan rates via Admin Dashboard.

## 📡 Streaming Data

### Mock Mode (Default)

When `MOCK_MODE=true` or no Dhan credentials:
- Generates realistic tick data every second
- Simulates OI spurts (≥9.5% change)
- 17 strikes around current spot
- Deterministic but randomized values

### Dhan API Mode

Set in `apps/api/.env`:
```
DHAN_API_KEY=your_api_key
DHAN_ACCESS_TOKEN=your_access_token
MOCK_MODE=false
```

**Note**: Dhan API integration is a placeholder. Implement actual WebSocket/REST calls per [Dhan API docs](https://api.dhan.co).

## 🎨 UI Layout (29 Rows)

1. **Header** (sticky): "OPTION BUYER's DASHBOARD"
2. **Golden Subheader** (sticky): Contact + Admin/Refresh/Logout buttons
3. **Dynamic Numbers** (sticky): Pivot, S1/S2, R1/R2, Mood bar, OI Spurt
4. **TabBar** (scrolls): Index tabs with spot and expiry dropdown
5. **CE/PE Title Bar** (scrolls): Green "CE" | Instrument | Red "PE"
6–22. **Option Chain** (scrolls): 17 rows, mirror columns
23. **Spacer** (optional)
24. **Summary Stats**: Vol CE/PE, OI, PCR, Greeks
25–28. **Targets**: Daily/Weekly/Monthly Bullish/Bearish
29. **Footer Warning** (sticky): "warning – This dashboard is for learning..."

## 🎨 Highlight Logic

- **Bright Green**: Highest CE Volume
- **Bright Red**: Highest PE Volume
- **Bright Green**: Highest CE OI
- **Bright Red**: Highest PE OI
- **Light Green**: CE OI% > 60% increase
- **Pink**: PE OI% > 60% increase
- **Yellow**: OI% > 60% decrease OR OI Spurt ≥ 9.5%
- **Gold Underline**: Spot strike row
- **Green/Red Text**: LTP change positive/negative

## 📖 Documentation

- **[spec.md](./docs/spec.md)**: Complete requirements and formulas
- **[api.md](./docs/api.md)**: REST API endpoint contracts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file

## 📞 Support

**Primexa Learning Series**  
WhatsApp: 9836001579  
Email: primexa1967@gmail.com

## 🙏 Acknowledgments

- Dhan API for market data
- Material-UI for UI components
- Black-Scholes model for Greeks calculations

---

**⚠️ Disclaimer**: This dashboard is for learning and research purposes only. Not financial advice. Trade at your own risk.
