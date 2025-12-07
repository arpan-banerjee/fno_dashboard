import { useQuery } from '@tanstack/react-query';
import { IndexQuote } from '../types/market.types';
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000';

/**
 * Fetch quote for a specific index symbol
 */
async function fetchIndexQuote(symbol: string): Promise<IndexQuote> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/market/quotes/${symbol}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

  return response.json();
}

/**
 * Custom hook to fetch and manage live price data for an index
 * Uses polling for real-time updates (every 5 seconds)
 */
export function useIndexLivePrice(symbol: string, enabled: boolean = true) {
  return useQuery<IndexQuote>({
    queryKey: ['indexQuote', symbol],
    queryFn: () => fetchIndexQuote(symbol),
    enabled: enabled && symbol !== 'FNO' && symbol !== 'BANKEX', // Don't fetch for placeholder tabs
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 4000, // Consider data stale after 4 seconds
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Custom hook with WebSocket support for real-time price updates
 * Falls back to polling if WebSocket is unavailable
 */
export function useIndexLivePriceWebSocket(symbol: string, enabled: boolean = true) {
  const [wsPrice] = useState<IndexQuote | null>(null);
  const [wsConnected] = useState(false);

  // Polling fallback
  const pollingQuery = useQuery<IndexQuote>({
    queryKey: ['indexQuote', symbol],
    queryFn: () => fetchIndexQuote(symbol),
    enabled: enabled && !wsConnected && symbol !== 'FNO' && symbol !== 'BANKEX',
    refetchInterval: 5000,
    staleTime: 4000,
    retry: 2,
  });

  // WebSocket connection (to be implemented)
  useEffect(() => {
    if (!enabled || symbol === 'FNO' || symbol === 'BANKEX') {
      return;
    }

    // TODO: Implement WebSocket connection
    // For now, use polling fallback
    console.log(`WebSocket for ${symbol} - coming soon, using polling`);

    return () => {
      // Cleanup WebSocket connection
    };
  }, [symbol, enabled]);

  // Return WebSocket data if available, otherwise polling data
  return {
    data: wsPrice || pollingQuery.data,
    isLoading: pollingQuery.isLoading,
    error: pollingQuery.error,
    isConnected: wsConnected,
  };
}
