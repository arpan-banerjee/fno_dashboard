# Quick Start Guide - Option Buyers' Dashboard

Welcome! This guide will get you up and running with the Option Buyers' Dashboard in under 5 minutes.

## Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (optional, for version control)
- A code editor (VS Code recommended)

## Installation Steps

### 1. Install Dependencies

Open a terminal in the project root and run:

```bash
npm install
```

This will install all dependencies for the monorepo (shared package, API, and web app).

### 2. Setup Environment Variables

#### Backend Configuration

```bash
# Copy the example file
copy apps\api\.env.example apps\api\.env

# Or on Linux/Mac:
cp apps/api/.env.example apps/api/.env
```

The default `.env` is configured for development with **mock mode enabled**:
- JWT authentication works
- Mock data stream generates realistic option chain
- Seeded superadmin account ready to use

**No Dhan API credentials needed to start!**

#### Frontend Configuration

```bash
# Copy the example file
copy apps\web\.env.example apps\web\.env

# Or on Linux/Mac:
cp apps/web/.env.example apps/web/.env
```

Default settings point to `localhost:4000` for the API.

### 3. Build Shared Package

The shared package contains all formulas and types used by both frontend and backend:

```bash
npm run build --workspace=packages/shared
```

## Running the Application

### Start Backend API

In **Terminal 1**:

```bash
npm run dev:api
```

You should see:
```
✓ Default settings created
✓ Superadmin user created: primexa1967@gmail.com
🚀 API server running on http://localhost:4000
📡 WebSocket server running on ws://localhost:4000/stream/ticks
🔧 Mock mode: ENABLED
```

### Start Frontend Web App

In **Terminal 2** (open a new terminal):

```bash
npm run dev:web
```

You should see:
```
  VITE v5.x.x  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 3. Access the Dashboard

1. Open your browser and navigate to: **http://localhost:3000**

2. **Login** with the seeded superadmin account:
   - **Email**: `primexa1967@gmail.com`
   - **Password**: `ChangeMe!123`

3. You're in! 🎉

## What You'll See

### Dashboard (Main Screen)

- **Header**: "OPTION BUYER's DASHBOARD"
- **Golden Bar**: Contact info + Admin/Refresh/Logout buttons
- **Dynamic Numbers**: Pivot, S1/S2, R1/R2, Mood indicator
- **Tabs**: NIFTY 50, Bank Nifty, etc. (click to switch)
- **Option Chain**: 17 strikes with CE/PE data (mock data in real-time)
- **Summary Stats**: Volume, OI, PCR, Greeks
- **Targets**: Daily/Weekly/Monthly projections
- **Footer**: Learning disclaimer

### Admin Dashboard

Click the **Admin** button (visible only for superadmin):

- **Counters**: Total users, revenue, plan distribution
- **Settings**: Configure trial days, plan rates, payment links
- **User Management**: Search, filter, update user accounts
- **Logs**: View recent admin actions

## Key Features to Try

### 1. Switch Indices

Click different tabs (NIFTY 50, Bank Nifty, etc.) to see option chains for each index.

### 2. Auto-Refresh

The mock stream updates data every second. Watch the LTP and OI values change in real-time.

### 3. Highlight Logic

Look for:
- **Bright Green**: Highest CE Volume/OI
- **Bright Red**: Highest PE Volume/OI
- **Yellow**: OI Spurt (≥9.5% change)
- **Gold Underline**: Spot strike (moves with price)

### 4. Built-Up Tags

Each option shows classification:
- **Long Built Up** (dark green)
- **Short Cover** (light green)
- **Short Built Up** (dark red)
- **Long Unwind** (light red)

### 5. Create New User

1. Logout
2. Register a new account (gets 30-day free trial)
3. Login and explore user-level features

## Testing

Run tests to verify everything works:

```bash
# Test all packages
npm test

# Test specific workspace
npm test --workspace=packages/shared
npm test --workspace=apps/api
npm test --workspace=apps/web
```

## Common Issues & Solutions

### Issue: "Cannot find module"

**Solution**: Make sure you installed dependencies and built the shared package:
```bash
npm install
npm run build --workspace=packages/shared
```

### Issue: Port 4000 or 3000 already in use

**Solution**: Either:
- Stop the process using that port
- Or change the port in `.env` files:
  - API: `apps/api/.env` → `PORT=4001`
  - Web: `apps/web/.env` → `VITE_API_BASE_URL=http://localhost:4001`

### Issue: TypeScript errors in VS Code

**Solution**: 
1. Close and reopen VS Code
2. Or run: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Issue: Mock data not updating

**Solution**: Check that backend is running and WebSocket connection is established (check browser console for errors).

## Production Build

When ready to deploy:

```bash
# Build all packages
npm run build

# Start API in production
cd apps/api
npm start

# Serve web app (use any static server or CDN)
cd apps/web
npm run preview
```

## Next Steps

### Connect to Real Dhan API

1. Get API credentials from [Dhan](https://api.dhan.co)
2. Update `apps/api/.env`:
   ```
   DHAN_API_KEY=your_key
   DHAN_ACCESS_TOKEN=your_token
   MOCK_MODE=false
   ```
3. Implement actual Dhan WebSocket in `apps/api/src/services/dhanClient.ts`

### Customize the Dashboard

- **Colors**: Edit `apps/web/src/styles/theme.ts`
- **Formulas**: Modify `packages/shared/src/formulas/`
- **Plan Rates**: Use Admin Dashboard → Settings
- **UI Layout**: Edit components in `apps/web/src/components/`

### Deploy to Production

- **Backend**: Deploy to Heroku, AWS, DigitalOcean, etc.
- **Frontend**: Deploy to Vercel, Netlify, or any CDN
- **Database**: Migrate from JSON to PostgreSQL/MongoDB for scalability

## Documentation

- **[README.md](../README.md)**: Full project overview
- **[docs/spec.md](../docs/spec.md)**: Complete specifications & formulas
- **[docs/api.md](../docs/api.md)**: API endpoint documentation

## Support

Having issues? Need help?

- **Email**: primexa1967@gmail.com
- **WhatsApp**: 9836001579
- **GitHub Issues**: Open an issue in the repository

---

**Happy Trading! 📈**

*Remember: This dashboard is for learning and research purposes only. Not financial advice.*
