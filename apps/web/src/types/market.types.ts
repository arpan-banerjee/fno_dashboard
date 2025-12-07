/**
 * Market data types for Index Tabs component
 */

export interface IndexQuote {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface ExpiryDate {
  date: string;
  label: string;
}

export interface IndexExpiries {
  symbol: string;
  expiries: ExpiryDate[];
}

export interface IndexTab {
  id: string;
  label: string;
  symbol: string;
  isLink?: boolean;
  badge?: string;
}

export const INDEX_TABS: IndexTab[] = [
  { id: 'nifty', label: 'Nifty50', symbol: 'NIFTY' },
  { id: 'banknifty', label: 'BankNifty', symbol: 'BANKNIFTY' },
  { id: 'finnifty', label: 'FinNifty', symbol: 'FINNIFTY' },
  { id: 'midcapnifty', label: 'MidcapNifty', symbol: 'MIDCAPNIFTY' },
  { id: 'sensex', label: 'Sensex', symbol: 'SENSEX' },
  { id: 'bankex', label: 'Bankex', symbol: 'BANKEX', badge: 'Soon' },
  { id: 'fno', label: 'Stock Option', symbol: 'FNO', isLink: true, badge: 'Coming Soon' },
];
