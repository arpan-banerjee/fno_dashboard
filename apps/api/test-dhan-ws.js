const WebSocket = require('ws');
require('dotenv').config();

const token = process.env.DHAN_ACCESS_TOKEN;
const clientId = process.env.DHAN_CLIENT_ID;

const wsUrl = `wss://api-feed.dhan.co?version=2&token=${token}&clientId=${clientId}&authType=2`;

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('WebSocket connected');

  const request = {
    RequestCode: 15,
    InstrumentCount: 2,
    InstrumentList: [
      { ExchangeSegment: 'NSE_EQ', SecurityId: '1333' },
      { ExchangeSegment: 'BSE_EQ', SecurityId: '532540' }
    ]
  };

  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

ws.on('close', () => {
  console.log('WebSocket closed');
});
