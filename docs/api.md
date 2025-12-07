# Option Buyers' Dashboard - API Documentation

Base URL: `http://localhost:4000` (development)

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication via `Authorization: Bearer <token>` header.

---

## Authentication Endpoints

### POST /auth/register

Register a new user with 30-day free trial.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "SecurePass123"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "status": "free"
  }
}
```

---

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "primexa1967@gmail.com",
  "password": "ChangeMe!123",
  "device_fingerprint": "device_unique_id"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Primexa Admin",
    "email": "primexa1967@gmail.com",
    "role": "superadmin",
    "status": "paid"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account expired (redirectTo: `/paid-plan`) or device limit exceeded

---

### POST /auth/logout

Logout (stateless JWT, token discarded client-side).

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/verify-sms

Verify SMS code for device management (stub in dev).

**Request Body:**
```json
{
  "code": "123456",
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "SMS verified"
}
```

---

## Admin Endpoints

**Authorization:** Requires `superadmin` or `admin` role.

### GET /admin/counters

Get dashboard counters.

**Response:** `200 OK`
```json
{
  "totalUsers": 150,
  "freeUsers": 100,
  "paidUsers": 40,
  "expiredUsers": 10,
  "totalRevenue": 79960,
  "taxPercent": 18
}
```

---

### GET /admin/settings

Get admin settings.

**Response:** `200 OK`
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

---

### PUT /admin/settings

Update admin settings.

**Request Body:** Same as GET response

**Response:** `200 OK` (updated settings)

---

### GET /admin/users

Get users list with optional filtering.

**Query Parameters:**
- `query` (optional): Search by name/email/mobile
- `status` (optional): Filter by `all|free|paid|expired`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "user",
    "plans": [...],
    "devices": [...],
    "status": "free",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### PUT /admin/users/:id

Update user (role, status, plan).

**Request Body:**
```json
{
  "role": "admin",
  "status": "paid",
  "plans": [...]
}
```

**Response:** `200 OK` (updated user)

---

### GET /admin/logs

Get recent admin logs.

**Query Parameters:**
- `limit` (optional, default: 100): Number of logs to return

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "adminId": "uuid",
    "action": "update_settings",
    "details": { ... }
  }
]
```

---

## Market Endpoints

**Authorization:** Requires authentication.

### GET /market/indices

Get list of available indices.

**Response:** `200 OK`
```json
[
  {
    "label": "NIFTY 50",
    "name": "nifty50",
    "spot": 19650,
    "hasDropdown": true,
    "expiries": ["2024-01-25", "2024-02-01"]
  },
  ...
]
```

---

### GET /market/option-chain

Get option chain for specified index and expiry.

**Query Parameters:**
- `index` (default: nifty50): Index name
- `expiry` (optional): Expiry date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "index": "nifty50",
  "spot": 19650,
  "expiry": "2024-01-25",
  "rows": [
    {
      "strike": 19500,
      "pcr": 1.25,
      "ce": {
        "strike": 19500,
        "ltp": 185.50,
        "ltpChg": 5.25,
        "ltpChgPercent": 2.91,
        "oi": 125000,
        "oiChg": 15000,
        "oiChgPercent": 13.64,
        "volume": 45000,
        "iv": 18.5,
        "tvItm": 35.50,
        "delta": 0.65,
        "builtUp": "Long Built Up"
      },
      "pe": { ... },
      "isSpotStrike": false
    },
    ...
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### GET /market/summary

Get summary statistics.

**Query Parameters:**
- `index` (default: nifty50)
- `expiry` (optional)

**Response:** `200 OK`
```json
{
  "volCE": 2500000,
  "volPE": 3000000,
  "totalVol": 5500000,
  "callOI": 15000000,
  "putOI": 18000000,
  "totalOI": 33000000,
  "pcr": 1.20,
  "alpha": 0.05,
  "beta": 1.2,
  "gamma": 0.015,
  "delta": 0.45,
  "rho": 0.02
}
```

---

### GET /market/ranges

Get VIX-based ranges.

**Query Parameters:**
- `spot` (default: 18000): Current spot price
- `vix` (default: 15): VIX value

**Response:** `200 OK`
```json
{
  "daily": {
    "upper": 18141.21,
    "lower": 17858.79,
    "upsideTarget": 18423.63,
    "downsideTarget": 17576.37,
    "rangeValue": 141.21
  },
  "weekly": { ... },
  "monthly": { ... }
}
```

---

### GET /market/pivot

Get pivot levels.

**Query Parameters:**
- `index` (default: nifty50)

**Response:** `200 OK`
```json
{
  "pivot": 19650,
  "r1": 19750,
  "r2": 19850,
  "s1": 19550,
  "s2": 19450
}
```

---

## WebSocket Streaming

### WS /stream/ticks

Real-time market data streaming.

**Connection:** `ws://localhost:4000/stream/ticks`

**Client → Server (Subscribe):**
```json
{
  "type": "subscribe",
  "symbols": ["NIFTY50", "NIFTY50-19600-CE", "NIFTY50-19600-PE"]
}
```

**Server → Client (Tick Data):**
```json
{
  "symbol": "NIFTY50-19600-CE",
  "ltp": 185.50,
  "volume": 45000,
  "oi": 125000,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Client → Server (Unsubscribe):**
```json
{
  "type": "unsubscribe",
  "symbols": ["NIFTY50-19600-CE"]
}
```

---

## Error Responses

All endpoints may return:

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Format:**
```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

Default: 100 requests per 15 minutes per IP (configurable).

**Headers:**
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

**Contact:** primexa1967@gmail.com | WhatsApp: 9836001579
