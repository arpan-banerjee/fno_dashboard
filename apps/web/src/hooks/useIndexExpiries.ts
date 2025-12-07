import { useQuery } from '@tanstack/react-query';
import { IndexExpiries } from '../types/market.types';

const API_BASE_URL = 'http://localhost:4000';

/**
 * Fetch expiry dates for a specific index symbol
 */
async function fetchIndexExpiries(symbol: string): Promise<IndexExpiries> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/market/expiries/${symbol}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch expiries for ${symbol}`);
  }

  return response.json();
}

/**
 * Custom hook to fetch expiry dates for an index
 * Data is cached for 1 hour since expiries don't change frequently
 */
export function useIndexExpiries(symbol: string, enabled: boolean = false) {
  return useQuery<IndexExpiries>({
    queryKey: ['indexExpiries', symbol],
    queryFn: () => fetchIndexExpiries(symbol),
    enabled: enabled && symbol !== 'FNO' && symbol !== 'BANKEX', // Don't fetch for placeholder tabs
    staleTime: 1000 * 60 * 60, // 1 hour - expiries don't change frequently
    gcTime: 1000 * 60 * 60 * 2, // Cache for 2 hours
    retry: 1,
  });
}
