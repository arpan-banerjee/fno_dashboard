import { useQuery } from '@tanstack/react-query';
import { IVDEXData } from '../types/optionChain.types';

const API_BASE_URL = 'http://localhost:4000';

/**
 * Fetch IVDEX data for a specific index symbol
 */
async function fetchIVDEX(symbol: string): Promise<IVDEXData> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/market/ivdex/${symbol}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch IVDEX for ${symbol}`);
  }

  return response.json();
}

/**
 * Hook to fetch IVDEX (IV Index) with trend arrow
 * Refreshes every 10 seconds
 */
export function useIVDEX(symbol: string, enabled: boolean = true) {
  return useQuery<IVDEXData>({
    queryKey: ['ivdex', symbol],
    queryFn: () => fetchIVDEX(symbol),
    enabled: enabled && !!symbol,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}
