# 🔧 Dhan API Troubleshooting - HTTP 404 Error Resolution

## ❌ PROBLEM IDENTIFIED

**Your Issue:** `https://api.dhan.co/v2/marketfeed/ltp` returns HTTP 404

**Root Cause:** The endpoint `/v2/marketfeed/ltp` **requires a POST request**, not GET. Also, it requires a **request body** with exchange segments and security IDs.

---

## ✅ CORRECT IMPLEMENTATION

### 1. **Correct Endpoint for LTP (Last Traded Price)**

**Endpoint:** `POST https://api.dhan.co/v2/marketfeed/ltp`

**Method:** `POST` (not GET)

**Purpose:** Retrieve LTP for list of instruments with single API request

---

### 2. **Required Headers**

```
access-token: <Your API Secret/Access Token>
client-id: <Your Client ID>
Content-Type: application/json
Accept: application/json
```

**Your Credentials:**
- `client-id`: `1100448841`
- `access-token`: `e0a6ad86-df4a-4017-b001-16a2ec9d1ffe` (your DHAN_API_SECRET)

---

### 3. **Request Body Structure**

The body must specify **Exchange Segment** and **Security IDs**:

```json
{
  "NSE_EQ": [11536],
  "NSE_FNO": [49081, 49082]
}
```

Or for indices (IDX_I segment):

```json
{
  "IDX_I": [13, 25, 51]
}
```

**Exchange Segments:**
- `IDX_I` - Index values (NIFTY, BANKNIFTY, etc.)
- `NSE_EQ` - NSE Equity Cash
- `NSE_FNO` - NSE Futures & Options
- `BSE_EQ` - BSE Equity Cash
- `MCX_COMM` - MCX Commodity

---

### 4. **Security IDs for Major Indices**

| Symbol | Exchange Segment | Security ID |
|--------|-----------------|-------------|
| NIFTY 50 | IDX_I | 13 |
| BANK NIFTY | IDX_I | 25 |
| FIN NIFTY | IDX_I | 51 |
| SENSEX | IDX_I | 1 |
| MIDCAP NIFTY | IDX_I | 3 |

**Note:** Your current mapping uses NSE_FNO security IDs (26000, 26009, etc.) which are for **Futures contracts**, not spot indices!

---

### 5. **Working cURL Example**

#### Get NIFTY 50 Spot Price:

```bash
curl --request POST \
  --url https://api.dhan.co/v2/marketfeed/ltp \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'access-token: e0a6ad86-df4a-4017-b001-16a2ec9d1ffe' \
  --header 'client-id: 1100448841' \
  --data '{
    "IDX_I": [13, 25, 51]
  }'
```

#### Get Multiple Indices:

```bash
curl --request POST \
  --url https://api.dhan.co/v2/marketfeed/ltp \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'access-token: e0a6ad86-df4a-4017-b001-16a2ec9d1ffe' \
  --header 'client-id: 1100448841' \
  --data '{
    "IDX_I": [13, 25, 51, 1]
  }'
```

**Expected Response:**

```json
{
  "data": {
    "IDX_I": {
      "13": {
        "last_price": 24500.50
      },
      "25": {
        "last_price": 52300.75
      },
      "51": {
        "last_price": 23150.25
      }
    }
  },
  "status": "success"
}
```

---

### 6. **Alternative: WebSocket for Real-Time Data**

For continuous real-time updates, use WebSocket instead of polling REST API:

**WebSocket URL:**
```
wss://api-feed.dhan.co?version=2&token=e0a6ad86-df4a-4017-b001-16a2ec9d1ffe&clientId=1100448841&authType=2
```

**Subscribe to Ticker (LTP):**
```json
{
  "RequestCode": 15,
  "InstrumentCount": 1,
  "InstrumentList": [
    {
      "ExchangeSegment": "IDX_I",
      "SecurityId": "13"
    }
  ]
}
```

**Ticker Packet Response (Binary):**
- Bytes 9-12: LTP (float32)
- Bytes 13-16: Last Trade Time (EPOCH)

---

## 🔨 CODE FIXES NEEDED

### Fix 1: Update Security ID Mapping

**File:** `apps/api/src/services/dhanClient.ts`

**Current (WRONG):**
```typescript
private securityIdMap: SecurityIdMap = {
  'NIFTY': '26000',      // This is NIFTY FUTURES, not spot!
  'BANKNIFTY': '26009',  // This is BANKNIFTY FUTURES, not spot!
  'FINNIFTY': '26037',
  'MIDCPNIFTY': '26074',
  'SENSEX': '1',
};
```

**Corrected:**
```typescript
private securityIdMap: SecurityIdMap = {
  'NIFTY': '13',         // NIFTY 50 INDEX
  'BANKNIFTY': '25',     // BANK NIFTY INDEX
  'FINNIFTY': '51',      // FIN NIFTY INDEX
  'MIDCPNIFTY': '3',     // MIDCAP NIFTY INDEX
  'SENSEX': '1',         // SENSEX INDEX
};

// Exchange segments for each
private exchangeSegmentMap: { [key: string]: string } = {
  'NIFTY': 'IDX_I',
  'BANKNIFTY': 'IDX_I',
  'FINNIFTY': 'IDX_I',
  'MIDCPNIFTY': 'IDX_I',
  'SENSEX': 'IDX_I',
};
```

---

### Fix 2: Update getSpotPrice Method

**Current Implementation (WRONG - uses GET with params):**
```typescript
async getSpotPrice(symbol: string): Promise<number> {
  const response = await axios.get(
    'https://api.dhan.co/v2/marketfeed/ltp',
    {
      headers: { 'access-token': this.sessionToken! },
      params: { exchangeSegment: 1, securityId: securityId }  // WRONG!
    }
  );
}
```

**Corrected Implementation:**
```typescript
async getSpotPrice(symbol: string): Promise<number> {
  try {
    if (!this.sessionToken) {
      await this.authenticate();
    }

    const securityId = this.getSecurityId(symbol);
    const exchangeSegment = this.exchangeSegmentMap[symbol.toUpperCase()] || 'IDX_I';
    
    // Build request body
    const requestBody: { [key: string]: string[] } = {
      [exchangeSegment]: [securityId]
    };

    console.log(`📊 Fetching spot price for ${symbol} (${exchangeSegment}: ${securityId})...`);
    
    const response = await axios.post(
      'https://api.dhan.co/v2/marketfeed/ltp',
      requestBody,
      {
        headers: {
          'access-token': this.sessionToken!,
          'client-id': this.config.clientId,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log('📊 Dhan API response:', JSON.stringify(response.data, null, 2));

    // Extract LTP from response
    if (response.data && response.data.status === 'success' && response.data.data) {
      const segmentData = response.data.data[exchangeSegment];
      if (segmentData && segmentData[securityId]) {
        const ltp = segmentData[securityId].last_price;
        console.log(`✅ Spot price for ${symbol}: ${ltp}`);
        return ltp;
      }
    }

    throw new Error('Invalid response format from Dhan API');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Failed to fetch spot price for ${symbol}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to fetch spot price: ${error.response?.data?.errorMessage || error.message}`);
    }
    throw error;
  }
}
```

---

### Fix 3: Update WebSocket Subscription

**Current (WRONG):**
```typescript
const subscriptionMessage = {
  RequestCode: 11,  // WRONG - this is "Connect Feed"
  InstrumentCount: 1,
  InstrumentList: [
    {
      ExchangeSegment: 1,  // WRONG - should be enum string
      SecurityId: securityId,
    },
  ],
};
```

**Corrected:**
```typescript
const subscriptionMessage = {
  RequestCode: 15,  // 15 = Subscribe to Ticker Packet (LTP)
  InstrumentCount: 1,
  InstrumentList: [
    {
      ExchangeSegment: 'IDX_I',  // Use string enum, not number
      SecurityId: '13',  // NIFTY 50 index
    },
  ],
};
```

---

## 📋 RATE LIMITS

| Type | Limit |
|------|-------|
| Per Second | 1 request |
| Per Minute | - |
| Per Hour | Unlimited |
| Per Day | 100,000 |

**Max Instruments per Request:** 1000

---

## 🚨 COMMON ERRORS

### Error DH-808: Authentication Failed
**Cause:** Invalid client-id or access-token
**Solution:** Verify your credentials in .env

### Error DH-806: Data APIs not subscribed
**Cause:** Your account doesn't have Data API access
**Solution:** Subscribe to Data APIs at developer.dhanhq.co

### Error DH-813: Invalid SecurityId
**Cause:** Using wrong security ID or exchange segment
**Solution:** Use correct IDs from instrument master

### Error DH-804: Too many instruments
**Cause:** Requesting more than 1000 instruments
**Solution:** Split into multiple requests

---

## 📚 DOCUMENTATION LINKS

- **API Documentation:** https://dhanhq.co/docs/v2/
- **Market Quote:** https://dhanhq.co/docs/v2/market-quote/
- **Live Market Feed (WebSocket):** https://dhanhq.co/docs/v2/live-market-feed/
- **Annexure (Enums):** https://dhanhq.co/docs/v2/annexure/
- **Instrument Master:** https://dhanhq.co/docs/v2/instruments/
- **Developer Portal:** https://developer.dhanhq.co/
- **API Playground:** https://api.dhan.co/v2/#/
- **Python Client:** https://github.com/dhan-oss/DhanHQ-py
- **Node.js Client:** https://github.com/dhan-oss/DhanHQ-js

---

## 💡 RECOMMENDATIONS

1. **Use WebSocket for Real-Time:** REST API is for snapshots, WebSocket for live streaming
2. **Batch Requests:** Fetch multiple symbols in one request (up to 1000)
3. **Cache Instrument Master:** Download once daily, don't query repeatedly
4. **Handle Rate Limits:** Max 1 req/sec for market data
5. **Use Official SDKs:** DhanHQ provides Python and Node.js clients

---

## 🧪 TEST YOUR IMPLEMENTATION

Run this PowerShell command to test:

```powershell
Invoke-WebRequest -Uri "https://api.dhan.co/v2/marketfeed/ltp" `
  -Method POST `
  -Headers @{
    "access-token" = "e0a6ad86-df4a-4017-b001-16a2ec9d1ffe"
    "client-id" = "1100448841"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
  } `
  -Body '{"IDX_I": ["13", "25", "51"]}' | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Expected output:
```json
{
  "data": {
    "IDX_I": {
      "13": { "last_price": 24500.50 },
      "25": { "last_price": 52300.75 },
      "51": { "last_price": 23150.25 }
    }
  },
  "status": "success"
}
```

---

## ☎️ CONTACT DHAN SUPPORT

If issues persist after implementing fixes above:

**Email:** help@dhan.co  
**Developer Portal:** https://developer.dhanhq.co/  
**Community:** https://madefortrade.in/c/dhanhq-forum

**Information to Provide:**
1. Your Client ID: `1100448841`
2. Exact API endpoint being called
3. Request headers and body
4. Error response received
5. Confirmation that Data API subscription is active

---

*Last Updated: November 22, 2025*  
*Documentation Version: DhanHQ API v2.0*
