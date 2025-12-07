# WebSocket & Redis Integration Setup

## Redis Installation

### Windows
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

### macOS
```bash
brew install redis
brew services start redis
```

### Linux
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### Docker (All Platforms)
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

## Environment Variables

Add to `apps/api/.env`:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Testing Redis Connection

```bash
# Test if Redis is running
redis-cli ping
# Should return: PONG

# Or using Docker
docker exec -it redis redis-cli ping
```

## WebSocket Architecture

### Backend (Port 4000)
- HTTP API: `http://localhost:4000`
- WebSocket: `ws://localhost:4000/ws`
- Legacy Ticks: `ws://localhost:4000/stream/ticks`

### Frontend (Port 3001)
- Connects to: `ws://localhost:4000/ws`
- Auto-reconnects on disconnect
- Subscribes to channels: `option-chain:SYMBOL:EXPIRY` and `ivdex:SYMBOL`

## Real-Time Data Flow

1. **Client subscribes** → WebSocket connection established
2. **Backend starts polling** → Fetches from Dhan API every 2s
3. **Data enrichment** → TV, IV, colors calculated
4. **Redis cache** → Historical data for comparisons
5. **WebSocket broadcast** → All subscribed clients receive updates
6. **Client renders** → Real-time table updates

## API Endpoints

### Start Polling
```bash
POST /market/polling/start
{
  "symbol": "NIFTY",
  "expiry": "2025-11-28",
  "interval": 2000
}
```

### Stop Polling
```bash
POST /market/polling/stop
{
  "symbol": "NIFTY",
  "expiry": "2025-11-28"
}
```

### Polling Status
```bash
GET /market/polling/status
```

## WebSocket Messages

### Subscribe
```json
{
  "type": "subscribe",
  "channel": "option-chain",
  "symbol": "NIFTY",
  "expiry": "2025-11-28"
}
```

### Update (from server)
```json
{
  "type": "update",
  "channel": "option-chain:NIFTY:2025-11-28",
  "data": {
    "symbol": "NIFTY",
    "strikes": [...],
    "pcr": 1.05
  },
  "timestamp": 1700000000000
}
```

## Monitoring

### Redis Stats
```bash
redis-cli INFO stats
```

### WebSocket Connections
Check server logs for:
- `👤 New WebSocket client connected`
- `📡 Client subscribed to: option-chain:NIFTY:...`
- `📤 Broadcast to option-chain:...`

## Troubleshooting

### Redis not connecting
- Check if Redis is running: `redis-cli ping`
- Verify REDIS_HOST and REDIS_PORT in .env
- Check firewall rules

### WebSocket not connecting
- Verify API server is running on port 4000
- Check browser console for connection errors
- Ensure `ws://localhost:4000/ws` is accessible

### No real-time updates
- Check if polling started: `GET /market/polling/status`
- Verify subscription in browser console
- Check server logs for broadcast messages

## Performance

- **Polling interval**: 2000ms (2 seconds) - adjustable
- **Redis TTL**: 24 hours for cached data
- **Max reconnect attempts**: 10
- **Reconnect interval**: 3000ms (3 seconds)
- **Cache entries per key**: 3 snapshots (for comparison)

## Multi-Server Support

Redis enables multiple API servers to share:
- Cached option chain data
- Historical IV values
- Previous strike data for comparisons

All servers can read/write to the same Redis instance, ensuring consistency across instances.
