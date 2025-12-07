/**
 * WebSocket Service for Real-Time Market Data Streaming
 * Manages client connections, subscriptions, and broadcasts
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';

interface SubscriptionMessage {
  type: 'subscribe' | 'unsubscribe';
  channel: string;
  symbol?: string;
  expiry?: string;
}

interface ClientSubscription {
  ws: WebSocket;
  subscriptions: Set<string>;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientSubscription> = new Map();
  private channelSubscribers: Map<string, Set<WebSocket>> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('error', (error) => {
      console.error('🔥 WebSocket Server Error:', error);
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('👤 New WebSocket client connected');
      
      // Initialize client subscription
      this.clients.set(ws, {
        ws,
        subscriptions: new Set(),
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: Date.now(),
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: SubscriptionMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          this.sendToClient(ws, {
            type: 'error',
            message: 'Invalid message format',
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('👋 WebSocket client disconnected');
        this.removeClient(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    console.log('✅ WebSocket server initialized on path /ws');
  }

  /**
   * Handle client messages
   */
  private handleMessage(ws: WebSocket, message: SubscriptionMessage): void {
    const { type, channel, symbol, expiry } = message;

    if (type === 'subscribe') {
      this.subscribe(ws, channel, symbol, expiry);
    } else if (type === 'unsubscribe') {
      this.unsubscribe(ws, channel, symbol, expiry);
    } else {
      this.sendToClient(ws, {
        type: 'error',
        message: `Unknown message type: ${type}`,
      });
    }
  }

  /**
   * Subscribe client to a channel
   */
  private subscribe(ws: WebSocket, channel: string, symbol?: string, expiry?: string): void {
    const client = this.clients.get(ws);
    if (!client) return;

    // Build subscription key
    let subscriptionKey = channel;
    if (symbol) subscriptionKey += `:${symbol}`;
    if (expiry) subscriptionKey += `:${expiry}`;

    // Add to client subscriptions
    client.subscriptions.add(subscriptionKey);

    // Add to channel subscribers
    if (!this.channelSubscribers.has(subscriptionKey)) {
      this.channelSubscribers.set(subscriptionKey, new Set());
    }
    this.channelSubscribers.get(subscriptionKey)!.add(ws);

    console.log(`📡 Client subscribed to: ${subscriptionKey}`);

    // Send confirmation
    this.sendToClient(ws, {
      type: 'subscribed',
      channel: subscriptionKey,
      message: `Subscribed to ${subscriptionKey}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Unsubscribe client from a channel
   */
  private unsubscribe(ws: WebSocket, channel: string, symbol?: string, expiry?: string): void {
    const client = this.clients.get(ws);
    if (!client) return;

    // Build subscription key
    let subscriptionKey = channel;
    if (symbol) subscriptionKey += `:${symbol}`;
    if (expiry) subscriptionKey += `:${expiry}`;

    // Remove from client subscriptions
    client.subscriptions.delete(subscriptionKey);

    // Remove from channel subscribers
    const subscribers = this.channelSubscribers.get(subscriptionKey);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(subscriptionKey);
      }
    }

    console.log(`📡 Client unsubscribed from: ${subscriptionKey}`);

    // Send confirmation
    this.sendToClient(ws, {
      type: 'unsubscribed',
      channel: subscriptionKey,
      message: `Unsubscribed from ${subscriptionKey}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove client and cleanup subscriptions
   */
  private removeClient(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    // Remove from all channel subscribers
    client.subscriptions.forEach((subscriptionKey) => {
      const subscribers = this.channelSubscribers.get(subscriptionKey);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(subscriptionKey);
        }
      }
    });

    // Remove client
    this.clients.delete(ws);
  }

  /**
   * Broadcast data to all subscribers of a channel
   */
  broadcast(channel: string, data: any): void {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return; // No subscribers for this channel
    }

    const message = {
      type: 'update',
      channel,
      data,
      timestamp: Date.now(),
    };

    let successCount = 0;
    subscribers.forEach((ws) => {
      if (this.sendToClient(ws, message)) {
        successCount++;
      }
    });

    console.log(`📤 Broadcast to ${channel}: ${successCount}/${subscribers.size} clients`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, data: any): boolean {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('❌ Error sending to client:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.channelSubscribers.size;
  }

  /**
   * Get statistics
   */
  getStats(): {
    connectedClients: number;
    activeSubscriptions: number;
    channels: string[];
  } {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.channelSubscribers.size,
      channels: Array.from(this.channelSubscribers.keys()),
    };
  }

  /**
   * Close all connections
   */
  close(): void {
    if (this.wss) {
      this.wss.close(() => {
        console.log('👋 WebSocket server closed');
      });
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Export class for testing
export { WebSocketService };
