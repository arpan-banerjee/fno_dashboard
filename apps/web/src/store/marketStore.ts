import { create } from 'zustand';
import { OptionChain, PivotLevels, SummaryStats, IndexName, Frequency } from '@option-dashboard/shared';

interface MarketState {
  selectedIndex: IndexName;
  selectedExpiry: string | null;
  frequency: Frequency;
  autoRefresh: boolean;
  optionChain: OptionChain | null;
  pivotLevels: PivotLevels | null;
  summaryStats: SummaryStats | null;
  vixValue: number;
  oiSpurtVisible: boolean;
  
  // Actions
  setSelectedIndex: (index: IndexName) => void;
  setSelectedExpiry: (expiry: string) => void;
  setFrequency: (frequency: Frequency) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setOptionChain: (chain: OptionChain) => void;
  setPivotLevels: (levels: PivotLevels) => void;
  setSummaryStats: (stats: SummaryStats) => void;
  setVixValue: (vix: number) => void;
  setOiSpurtVisible: (visible: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  selectedIndex: 'nifty50',
  selectedExpiry: null,
  frequency: '5m',
  autoRefresh: true,
  optionChain: null,
  pivotLevels: null,
  summaryStats: null,
  vixValue: 15,
  oiSpurtVisible: false,
  
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  setSelectedExpiry: (expiry) => set({ selectedExpiry: expiry }),
  setFrequency: (frequency) => set({ frequency }),
  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
  setOptionChain: (chain) => set({ optionChain: chain }),
  setPivotLevels: (levels) => set({ pivotLevels: levels }),
  setSummaryStats: (stats) => set({ summaryStats: stats }),
  setVixValue: (vix) => set({ vixValue: vix }),
  setOiSpurtVisible: (visible) => set({ oiSpurtVisible: visible }),
}));
