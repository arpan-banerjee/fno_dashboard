import apiClient from './client';
import { OptionChain, SummaryStats, PivotLevels, IndexInfo } from '@option-dashboard/shared';

export const marketApi = {
  /**
   * Get list of available indices
   */
  async getIndices(): Promise<IndexInfo[]> {
    const response = await apiClient.get<IndexInfo[]>('/market/indices');
    return response.data;
  },

  /**
   * Get option chain for specified index and expiry
   */
  async getOptionChain(index: string, expiry?: string): Promise<OptionChain> {
    const response = await apiClient.get<OptionChain>('/market/option-chain', {
      params: { index, expiry },
    });
    return response.data;
  },

  /**
   * Get summary statistics
   */
  async getSummary(index: string, expiry?: string): Promise<SummaryStats> {
    const response = await apiClient.get<SummaryStats>('/market/summary', {
      params: { index, expiry },
    });
    return response.data;
  },

  /**
   * Get VIX-based ranges
   */
  async getRanges(spot: number, vix: number): Promise<any> {
    const response = await apiClient.get('/market/ranges', {
      params: { spot, vix },
    });
    return response.data;
  },

  /**
   * Get pivot levels
   */
  async getPivotLevels(index: string): Promise<PivotLevels> {
    const response = await apiClient.get<PivotLevels>('/market/pivot', {
      params: { index },
    });
    return response.data;
  },
};
