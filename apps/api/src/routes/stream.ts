import { WebSocketServer, WebSocket } from 'ws';
import { TickData } from '@option-dashboard/shared';
import { getMockStream } from '../services/mockStream';
import { getDhanStream } from '../services/dhanClient';

/**
 * Setup WebSocket server for streaming market data
 */
export function setupWebSocketServer(wss: WebSocketServer): void {
  console.log('📡 WebSocket server initialized');

  // Determine if we're using mock or real stream
  let useMock = process.env.MOCK_MODE === 'true' || !process.env.DHAN_API_KEY;
  let streamSource;

  try {
    if (!useMock) {
      streamSource = getDhanStream();
      console.log('🔧 Using real Dhan API for streaming');
    } else {
      throw new Error('Mock mode enabled or missing credentials');
    }
  } catch (error) {
    console.log('🔧 Falling back to mock streaming:', error instanceof Error ? error.message : 'Unknown error');
    useMock = true;
    streamSource = getMockStream();
  }

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to stream');

    // Subscribe to stream
    const subscription = streamSource.subscribe((tick: TickData) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(tick));
      }
    });

    // Handle client messages (subscription requests)
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe') {
          // Handle subscription to specific symbols
          console.log('Client subscribed to:', message.symbols);
        } else if (message.type === 'unsubscribe') {
          // Handle unsubscribe
          console.log('Client unsubscribed from:', message.symbols);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected from stream');
      subscription.unsubscribe();
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}
