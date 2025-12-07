/**
 * WebSocket Hook for Real-Time Market Data
 * Manages connection, reconnection, subscriptions, and message handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  message?: string;
  timestamp?: number;
}

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (channel: string, symbol?: string, expiry?: string) => void;
  unsubscribe: (channel: string, symbol?: string, expiry?: string) => void;
  send: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnectAttempts: number;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());
  const isConnectingRef = useRef<boolean>(false);

  /**
   * Send message to WebSocket server
   */
  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  /**
   * Subscribe to a channel
   */
  const subscribe = useCallback((channel: string, symbol?: string, expiry?: string) => {
    const message = {
      type: 'subscribe',
      channel,
      symbol,
      expiry,
    };

    send(message);

    // Track subscription
    let subscriptionKey = channel;
    if (symbol) subscriptionKey += `:${symbol}`;
    if (expiry) subscriptionKey += `:${expiry}`;
    subscribedChannelsRef.current.add(subscriptionKey);

    console.log(`📡 Subscribed to: ${subscriptionKey}`);
  }, [send]);

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback((channel: string, symbol?: string, expiry?: string) => {
    const message = {
      type: 'unsubscribe',
      channel,
      symbol,
      expiry,
    };

    send(message);

    // Remove from tracked subscriptions
    let subscriptionKey = channel;
    if (symbol) subscriptionKey += `:${symbol}`;
    if (expiry) subscriptionKey += `:${expiry}`;
    subscribedChannelsRef.current.delete(subscriptionKey);

    console.log(`📡 Unsubscribed from: ${subscriptionKey}`);
  }, [send]);

  /**
   * Resubscribe to all channels after reconnection
   */
  const resubscribeAll = useCallback(() => {
    subscribedChannelsRef.current.forEach((subscriptionKey) => {
      const parts = subscriptionKey.split(':');
      const channel = parts[0];
      const symbol = parts[1];
      const expiry = parts[2];

      const message = {
        type: 'subscribe',
        channel,
        symbol,
        expiry,
      };

      send(message);
    });

    if (subscribedChannelsRef.current.size > 0) {
      console.log(`🔄 Resubscribed to ${subscribedChannelsRef.current.size} channels`);
    }
  }, [send]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    // Don't create multiple connections
    if (isConnectingRef.current || (wsRef.current && 
        (wsRef.current.readyState === WebSocket.CONNECTING || 
         wsRef.current.readyState === WebSocket.OPEN))) {
      return;
    }

    isConnectingRef.current = true;

    try {
      console.log(`🔌 Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        isConnectingRef.current = false;
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Resubscribe to all channels
        resubscribeAll();
        
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        isConnectingRef.current = false;
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('👋 WebSocket disconnected');
        isConnectingRef.current = false;
        setIsConnected(false);
        onDisconnect?.();

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          console.log(`🔄 Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else {
          console.error('❌ Max reconnect attempts reached. Giving up.');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
    }
  }, [url, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onConnect, onMessage, onError, onDisconnect, resubscribeAll]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setReconnectAttempts(0);
    console.log('👋 WebSocket disconnected manually');
  }, []);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount, using refs to avoid stale closures

  return {
    isConnected,
    subscribe,
    unsubscribe,
    send,
    connect,
    disconnect,
    reconnectAttempts,
  };
}

/**
 * Hook for subscribing to option chain updates
 */
export function useOptionChainWebSocket(symbol: string, expiry: string) {
  const [optionChainData, setOptionChainData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: `ws://localhost:4000/ws`,
    autoConnect: true,
    onMessage: (message) => {
      if (message.type === 'update' && message.channel?.startsWith('option-chain:')) {
        setOptionChainData(message.data);
        setLastUpdate(Date.now());
      }
    },
  });

  useEffect(() => {
    if (isConnected && symbol && expiry) {
      subscribe('option-chain', symbol, expiry);

      return () => {
        unsubscribe('option-chain', symbol, expiry);
      };
    }
  }, [isConnected, symbol, expiry, subscribe, unsubscribe]);

  return { optionChainData, lastUpdate, isConnected };
}

/**
 * Hook for subscribing to IV updates
 */
export function useIVWebSocket(symbol: string) {
  const [ivData, setIVData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: `ws://localhost:4000/ws`,
    autoConnect: true,
    onMessage: (message) => {
      if (message.type === 'update' && message.channel?.startsWith('ivdex:')) {
        setIVData(message.data);
        setLastUpdate(Date.now());
      }
    },
  });

  useEffect(() => {
    if (isConnected && symbol) {
      subscribe('ivdex', symbol);

      return () => {
        unsubscribe('ivdex', symbol);
      };
    }
  }, [isConnected, symbol, subscribe, unsubscribe]);

  return { ivData, lastUpdate, isConnected };
}
