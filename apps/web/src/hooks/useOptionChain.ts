import { useQuery } from '@tanstack/react-query';
import { OptionChainData } from '../types/optionChain.types';

const API_BASE_URL = 'http://localhost:4000';

/**
 * Fetch option chain data for a specific symbol and expiry
 */
async function fetchOptionChain(
  symbol: string,
  expiry: string
): Promise<OptionChainData> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${API_BASE_URL}/market/option-chain/${symbol}/${expiry}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch option chain for ${symbol} ${expiry}`);
  }

  return response.json();
}

/**
 * Hook to fetch option chain with color coding and built-up classification
 * Refreshes every 10 seconds
 */
export function useOptionChain(
  symbol: string,
  expiry: string,
  enabled: boolean = true
) {
  return useQuery<OptionChainData>({
    queryKey: ['optionChain', symbol, expiry],
    queryFn: () => fetchOptionChain(symbol, expiry),
    enabled: enabled && !!symbol && !!expiry,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}
