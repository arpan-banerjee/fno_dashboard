# Option Chain Color Logic - Quick Reference

## Volume Column Colors

### Highest Volume (Bold Font)
- **CE**: Green (#4caf50)
- **PE**: Red (#f44336)
- **Condition**: `volume === highestVolume && highestVolume > 0`

### Rising Volume (>70% increase)
- **CE**: Light Green (#c8e6c9)
- **PE**: Pink (#ffcdd2)
- **Condition**: `(currentVolume - previousVolume) / previousVolume >= 0.7`

### Default
- **Color**: Transparent (white background)

---

## OI (Open Interest) Column Colors

### Highest OI (Bold Font)
- **CE**: Green (#4caf50)
- **PE**: Red (#f44336)
- **Condition**: `oi === highestOI && highestOI > 0`

### Increasing OI (>60% increase)
- **CE**: Light Green (#c8e6c9)
- **PE**: Light Pink (#f8bbd0)
- **Condition**: `(currentOI - previousOI) / previousOI >= 0.6`

### Decreasing OI (>60% decrease) + FADE ANIMATION
- **Color**: Yellow (#ffeb3b)
- **Animation**: Fade to transparent over 3 seconds
- **Condition**: `(currentOI - previousOI) / previousOI <= -0.6`
- **CSS**: 
  ```css
  @keyframes fadeOut {
    0% { background-color: #ffeb3b; opacity: 1; }
    100% { background-color: transparent; opacity: 0; }
  }
  animation: fadeOut 3s ease-out forwards;
  ```

### Default
- **Color**: Transparent (white background)

---

## ATM (At-The-Money) Strike

### Visual Treatment
- **Border Bottom**: 3px solid #FFD700 (Golden)
- **Font Weight**: Bold
- **Condition**: `strikePrice === atmStrike`
- **ATM Detection**: Strike closest to spot price

---

## Built-up Classification

### LB (Long Build-up)
- **Color**: Green (#4caf50)
- **Condition**: OI increasing + Price increasing
- **Formula**: `oiChange > 0 && priceChange > 0`

### SB (Short Build-up)
- **Color**: Red (#f44336)
- **Condition**: OI increasing + Price decreasing
- **Formula**: `oiChange > 0 && priceChange < 0`

### LU (Long Unwinding)
- **Color**: Orange (#ff9800)
- **Condition**: OI decreasing + Price decreasing
- **Formula**: `oiChange < 0 && priceChange < 0`

### SC (Short Covering)
- **Color**: Light Green (#c8e6c9)
- **Condition**: OI decreasing + Price increasing
- **Formula**: `oiChange < 0 && priceChange > 0`

---

## IVDEX Trend Arrow

### Upward Trend ▲
- **Color**: Red (#f44336) if ivChange > 1
- **Color**: Orange (#ff9800) if 0 < ivChange <= 1
- **Condition**: `currentIV > previousIV`

### Downward Trend ▼
- **Color**: Green (#4caf50)
- **Condition**: `currentIV < previousIV`

### Neutral →
- **Color**: Grey (#9e9e9e)
- **Condition**: `currentIV === previousIV`

---

## Color Application Priority (Highest to Lowest)

1. **ATM Strike**: Golden underline (overrides all)
2. **Highest Volume/OI**: Green/Red with bold font
3. **Rising Volume/OI**: Light Green/Light Pink
4. **Decreasing OI**: Yellow with fade animation
5. **Default**: Transparent background

---

## Historical Data Requirements

### Cache System
- **Storage**: Last 3 snapshots per symbol+expiry
- **Refresh**: Every 10 seconds
- **Comparison**: Current vs Previous (second-to-last)

### Color Calculation Flow
```
1. Fetch current option chain data
2. Retrieve previous data from cache
3. Calculate change percentages
4. Determine color based on thresholds
5. Apply fade flag if OI decreasing
6. Store current data in cache
7. Return enriched data with color flags
```

---

## Strike Range

- **Formula**: ATM ± 15 strikes
- **Total Strikes**: 31 (15 above + ATM + 15 below)
- **Step Size**: 
  - NIFTY: 50
  - BANKNIFTY: 100
  - Others: 50

---

## PCR (Put-Call Ratio)

- **Formula**: Total PE OI / Total CE OI
- **Display**: 2 decimal places
- **Location**: Header info bar

---

## Color Hex Code Reference

| Name | Hex Code | Use Case |
|------|----------|----------|
| Green | #4caf50 | Highest CE Volume/OI, LB Built-up, ▼ IV |
| Light Green | #c8e6c9 | Rising CE Volume/OI, SC Built-up |
| Red | #f44336 | Highest PE Volume/OI, SB Built-up, ▲ IV (high) |
| Pink | #ffcdd2 | Rising PE Volume |
| Light Pink | #f8bbd0 | Increasing PE OI |
| Orange | #ff9800 | LU Built-up, ▲ IV (low) |
| Yellow | #ffeb3b | Decreasing OI (both CE/PE) |
| Golden | #FFD700 | ATM Strike underline |
| Grey | #9e9e9e | → IV (neutral) |
| White | #ffffff | Default background |

---

## Implementation Files

- **Backend Logic**: `apps/api/src/utils/optionChain.utils.ts`
- **Frontend Colors**: `apps/web/src/utils/optionChainColors.ts`
- **API Endpoint**: `GET /market/option-chain/:symbol/:expiry`
- **Table Component**: `apps/web/src/components/OptionChainTable.tsx`
