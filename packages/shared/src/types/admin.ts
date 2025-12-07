/**
 * Admin counters/dashboard stats
 */
export interface AdminCounters {
  totalUsers: number;
  freeUsers: number;
  paidUsers: number;
  expiredUsers: number;
  totalRevenue: number;
  taxPercent: number;
}

/**
 * Admin settings
 */
export interface AdminSettings {
  freeTrialDays: number;
  planRates: {
    paid_90: number;
    paid_180: number;
    paid_365: number;
  };
  paymentLink: string;
  qrImageUrl: string;
  taxPercent: number;
  oiChangeThreshold: number;  // default 60, toggleable
  oiSpurtThreshold: number;   // default 9.5
}

/**
 * Payment record
 */
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  planType: 'paid_90' | 'paid_180' | 'paid_365';
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
}

/**
 * Admin log entry
 */
export interface AdminLog {
  id: string;
  timestamp: string;
  adminId: string;
  action: string;
  details: Record<string, any>;
}

/**
 * User filter for admin queries
 */
export type UserFilter = 'all' | 'free' | 'paid' | 'expired';
