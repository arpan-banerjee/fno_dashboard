import { TickData } from '@option-dashboard/shared';
import axios from 'axios';
import WebSocket from 'ws';

/**
 * Dhan API client for real market data streaming
 * Documentation: https://api.dhan.co/docs
 */

interface DhanConfig {
  apiKey: string;
  apiSecret: string;
  accessToken?: string; // JWT access token from Dhan API
  clientId: string;
  feedUrl?: string;
}

interface Subscription {
  callback: (tick: TickData) => void;
  unsubscribe: () => void;
}

interface DhanAuthResponse {
  status: string;
  data: {
    session_token: string;
  };
}

interface DhanMarketFeedMessage {
  type: string;
  data?: any;
  ExchangeSegment?: number;
  SecurityId?: string;
  LTP?: number;
  LastTradeTime?: number;
  LastTradeQty?: number;
  Volume?: number;
  BidPrice?: number;
  AskPrice?: number;
  OI?: number;
  OpenInterest?: number;
}

interface SecurityIdMap {
  [key: string]: string;
}

class DhanClient {
  private config: DhanConfig;
  private connected: boolean = false;
  private sessionToken: string | null = null;
  private subscribers: Set<(tick: TickData) => void> = new Set();
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  
  // Rate limiting
  private lastApiCall: number = 0;
  private minApiCallInterval: number = 3000; // 3 seconds between API calls to avoid 429
  private apiCallQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  
  // Security ID mappings for major indices (SPOT/INDEX values, not futures)
  // Note: These are Dhan-specific numeric security IDs for IDX_I segment
  private securityIdMap: SecurityIdMap = {
    'NIFTY': '13',         // NIFTY 50 INDEX
    'BANKNIFTY': '25',     // BANK NIFTY INDEX
    'FINNIFTY': '27',      // FIN NIFTY INDEX
    'MIDCPNIFTY': '3',     // MIDCAP NIFTY INDEX
    'SENSEX': '1',         // SENSEX INDEX
    'INDIAVIX': '51',      // INDIA VIX
  };
  
  // Exchange segments for each symbol
  private exchangeSegmentMap: SecurityIdMap = {
    'NIFTY': 'IDX_I',
    'BANKNIFTY': 'IDX_I',
    'FINNIFTY': 'IDX_I',
    'MIDCPNIFTY': 'IDX_I',
    'SENSEX': 'IDX_I',
  };

  constructor(config: DhanConfig) {
    this.config = config;
  }

  /**
   * Authenticate and get session token from Dhan API
   * Note: Dhan API uses access_token directly in headers for authentication
   */
  private async authenticate(): Promise<string> {
    try {
      console.log('🔐 Setting up Dhan API authentication...');
      
      // Use the JWT access token if provided, otherwise fall back to apiSecret
      this.sessionToken = this.config.accessToken || this.config.apiSecret;
      
      if (!this.sessionToken) {
        throw new Error('No access token or API secret provided');
      }
      
      console.log('✅ Dhan authentication configured');
      return this.sessionToken;
    } catch (error) {
      console.error('❌ Dhan authentication setup failed:', error);
      throw error;
    }
  }

  /**
   * Rate limit API calls to prevent 429 errors
   * Uses a queue to serialize all API calls with minimum delay
   */
  private async rateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.apiCallQueue.push(async () => {
        try {
          const result = await apiCall();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the API call queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.apiCallQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.apiCallQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      
      if (timeSinceLastCall < this.minApiCallInterval) {
        const delay = this.minApiCallInterval - timeSinceLastCall;
        console.log(`⏱️  Rate limiting: waiting ${delay}ms before next API call (${this.apiCallQueue.length} in queue)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const apiCall = this.apiCallQueue.shift();
      if (apiCall) {
        this.lastApiCall = Date.now();
        await apiCall();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get security ID for a symbol
   */
  private getSecurityId(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();
    const securityId = this.securityIdMap[upperSymbol];
    
    if (!securityId) {
      throw new Error(`Security ID not found for symbol: ${symbol}`);
    }
    
    return securityId;
  }

  /**
   * Format expiry date for Dhan API
   * Converts from YYYY-MM-DD to DD-MMM-YYYY (e.g., "2024-11-28" to "28-NOV-2024")
   */
  private formatExpiryForDhan(expiry: string): string {
    try {
      const date = new Date(expiry);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting expiry date:', error);
      return expiry; // Return original if formatting fails
    }
  }

  /**
   * Parse expiry date from Dhan API format
   * Converts from DD-MMM-YYYY to YYYY-MM-DD (e.g., "28-NOV-2024" to "2024-11-28")
   */
  private parseExpiryFromDhan(expiry: string): string {
    try {
      const months: { [key: string]: string } = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      
      const parts = expiry.split('-');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1].toUpperCase()];
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      
      return expiry; // Return original if parsing fails
    } catch (error) {
      console.error('Error parsing expiry date:', error);
      return expiry;
    }
  }

  /**
   * Fetch current price for a symbol using Dhan Market Quote API
   * Uses POST /v2/marketfeed/quote with security IDs
   */
  async getSpotPrice(symbol: string): Promise<number> {
    try {
      if (!this.sessionToken) {
        await this.authenticate();
      }

      const upperSymbol = symbol.toUpperCase();
      
      console.log(`📊 Fetching current price for ${upperSymbol} from Dhan API...`);
      
      // Get security ID for the symbol
      const securityId = this.getSecurityId(upperSymbol);
      
      console.log(`🔍 Using Security ID: ${securityId} for ${upperSymbol}`);
      console.log(`🔑 Auth Headers: client-id=${this.config.clientId}, access-token=${this.sessionToken?.substring(0, 20)}...`);
      
      // Prepare request body - Dhan API requires numeric security IDs
      const numericSecurityId = parseInt(securityId, 10);
      const requestBody = {
        IDX_I: [numericSecurityId]
      };
      
      console.log(`📤 Request Body:`, JSON.stringify(requestBody, null, 2));
      
      // Use rate-limited API call to prevent 429 errors
      // Try quote endpoint first for full market data
      const response = await this.rateLimitedApiCall(() =>
        axios.post(
          `https://api.dhan.co/v2/marketfeed/quote`,
          requestBody,
          {
            headers: {
              'access-token': this.sessionToken!,
              'client-id': this.config.clientId,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        )
      );

      console.log('📊 Dhan API quote response:', JSON.stringify(response.data, null, 2));

      // Check if we got data
      if (!response.data) {
        throw new Error('Dhan API returned no data');
      }

      // Extract last_price from quote response
      // Dhan API v2 marketfeed/quote response format: { data: { IDX_I: { <securityId>: { last_price: value, ... } } } }
      if (response.data.data && response.data.data.IDX_I) {
        // Try both numeric and string keys since API behavior may vary
        const indexData = response.data.data.IDX_I[numericSecurityId] || response.data.data.IDX_I[securityId];
        
        if (indexData) {
          console.log(`📋 Index Data for ${securityId}:`, JSON.stringify(indexData, null, 2));
          
          // Dhan API uses 'last_price' field, not 'LTP'
          const currentPrice = indexData.last_price || indexData.LTP;
          
          if (currentPrice !== undefined) {
            console.log(`✅ Current price for ${upperSymbol}: ₹${currentPrice}`);
            return currentPrice;
          } else {
            console.warn(`⚠️ last_price field not found in index data. Available fields:`, Object.keys(indexData));
          }
        } else {
          console.warn(`⚠️ No data found for security ID ${securityId} (numeric: ${numericSecurityId}) in IDX_I response`);
          console.warn(`Available security IDs in response:`, Object.keys(response.data.data.IDX_I));
        }
      } else {
        console.warn(`⚠️ Response structure mismatch. Expected data.IDX_I but got:`, Object.keys(response.data));
        if (response.data.data) {
          console.warn(`Available exchange segments:`, Object.keys(response.data.data));
        }
      }

      throw new Error('Invalid response format from Dhan API - could not find LTP in quote data');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Failed to fetch current price for ${symbol}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          requestBody: error.config?.data
        });
        throw new Error(`Failed to fetch current price: ${error.response?.data?.errorMessage || error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Connect to Dhan streaming API via WebSocket
   */
  async connect(): Promise<void> {
    try {
      // Authenticate first if we don't have a token
      if (!this.sessionToken) {
        await this.authenticate();
      }

      this.connectWebSocket();
    } catch (error) {
      console.error('❌ Failed to connect to Dhan API:', error);
      throw error;
    }
  }

  /**
   * Establish WebSocket connection to Dhan market feed
   */
  private connectWebSocket(): void {
    try {
      const feedUrl = this.config.feedUrl || 'wss://api-feed.dhan.co';
      console.log('🔌 Connecting to Dhan WebSocket at:', feedUrl);

      this.ws = new WebSocket(feedUrl);

      this.ws.on('open', () => {
        console.log('✅ Dhan WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to NIFTY by default
        this.subscribeToInstrument('NIFTY');
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message: DhanMarketFeedMessage = JSON.parse(data.toString());
          this.handleMarketFeed(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ Dhan WebSocket error:', error);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`🔌 Dhan WebSocket closed: ${code} - ${reason}`);
        this.connected = false;
        this.reconnect();
      });
    } catch (error) {
      console.error('❌ Failed to establish WebSocket connection:', error);
      throw error;
    }
  }

  /**
   * Subscribe to an instrument on the WebSocket
   */
  private subscribeToInstrument(symbol: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected, cannot subscribe');
      return;
    }

    try {
      const upperSymbol = symbol.toUpperCase();
      const securityId = this.getSecurityId(upperSymbol);
      const exchangeSegment = this.exchangeSegmentMap[upperSymbol] || 'IDX_I';
      
      const subscriptionMessage = {
        RequestCode: 15, // 15 = Subscribe to Ticker Packet (LTP + LTT)
        InstrumentCount: 1,
        InstrumentList: [
          {
            ExchangeSegment: exchangeSegment, // Use string enum (IDX_I, NSE_EQ, etc.)
            SecurityId: securityId,
          },
        ],
      };

      this.ws.send(JSON.stringify(subscriptionMessage));
      console.log(`📡 Subscribed to ${symbol} (${exchangeSegment}: ${securityId})`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${symbol}:`, error);
    }
  }

  /**
   * Handle incoming market feed data
   */
  private handleMarketFeed(message: DhanMarketFeedMessage): void {
    try {
      // Convert Dhan format to our TickData format
      if (message.type === 'Ticker' && message.LTP) {
        const tick: TickData = {
          symbol: message.SecurityId || 'UNKNOWN',
          ltp: message.LTP,
          volume: message.Volume || 0,
          oi: message.OI || message.OpenInterest,
          timestamp: new Date().toISOString(),
        };

        // Notify all subscribers
        this.subscribers.forEach((callback) => callback(tick));
      }
    } catch (error) {
      console.error('❌ Error handling market feed:', error);
    }
  }

  /**
   * Reconnect to WebSocket after connection loss
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay);
  }

  /**
   * Subscribe to market feed
   */
  subscribe(callback: (tick: TickData) => void): Subscription {
    this.subscribers.add(callback);

    if (!this.connected) {
      this.connect();
    }

    return {
      callback,
      unsubscribe: () => {
        this.subscribers.delete(callback);
      },
    };
  }

  /**
   * Handle incoming message from Dhan API
   */
  private handleMessage(data: any): void {
    // TODO: Parse Dhan API message format and convert to TickData
    // Example:
    // const tick: TickData = {
    //   symbol: data.symbol,
    //   ltp: data.ltp,
    //   volume: data.volume,
    //   oi: data.open_interest,
    //   timestamp: new Date(data.timestamp).toISOString(),
    // };
    
    // this.subscribers.forEach(callback => callback(tick));
  }

  /**
   * Disconnect from Dhan API and cleanup
   */
  disconnect(): void {
    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.connected = false;
      this.subscribers.clear();
      this.reconnectAttempts = 0;
      
      console.log('✅ Disconnected from Dhan API');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Fetch option chain data from Dhan API
   * GET /charts/intraday?symbol={symbol}&instrument=OPTIDX&expiry={expiry}
   */
  async getOptionChain(symbol: string, expiry: string): Promise<any> {
    try {
      if (!this.sessionToken) {
        await this.authenticate();
      }

      const upperSymbol = symbol.toUpperCase();
      console.log(`📊 Fetching option chain for ${upperSymbol} expiry ${expiry}...`);

      // Format expiry date for Dhan API (expects DD-MMM-YYYY format like "28-NOV-2024")
      const formattedExpiry = this.formatExpiryForDhan(expiry);
      
      // Use rate-limited API call to prevent 429 errors
      const response = await this.rateLimitedApiCall(() =>
        axios.post(
          `https://api.dhan.co/v2/optionchain`,
          {
            underlying: upperSymbol,
            expiryCode: formattedExpiry,
          },
          {
            headers: {
              'access-token': this.sessionToken!,
              'client-id': this.config.clientId,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        )
      );

      console.log(`✅ Option chain data received for ${upperSymbol}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Failed to fetch option chain:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Fetch implied volatility (IV) data from Dhan API
   * This may need to be calculated from option prices if not directly available
   */
  async getIVData(symbol: string): Promise<any> {
    try {
      if (!this.sessionToken) {
        await this.authenticate();
      }

      const upperSymbol = symbol.toUpperCase();
      console.log(`📊 Fetching IV data for ${upperSymbol}...`);

      // Try to get IV from market data or VIX-equivalent
      // For NIFTY, we can use India VIX (security ID 51 in NSE_INDEX)
      if (upperSymbol === 'NIFTY') {
        const response = await this.rateLimitedApiCall(() =>
          axios.post(
            `https://api.dhan.co/v2/marketfeed/ltp`,
            {
              NSE_INDEX: ['51'] // India VIX security ID
            },
            {
              headers: {
                'access-token': this.sessionToken!,
                'client-id': this.config.clientId,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }
          )
        );

        console.log(`✅ IV/VIX data received for ${upperSymbol}`);
        
        // Extract VIX value from response
        if (response.data && response.data.data && response.data.data.NSE_INDEX && response.data.data.NSE_INDEX['51']) {
          return {
            iv: response.data.data.NSE_INDEX['51'].LTP,
            symbol: 'INDIAVIX'
          };
        }
        
        return response.data;
      }

      // For other symbols, return null (will need calculation)
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Failed to fetch IV data:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Fetch expiry dates for an index from Dhan API
   */
  async getExpiries(symbol: string): Promise<string[]> {
    try {
      if (!this.sessionToken) {
        await this.authenticate();
      }

      const upperSymbol = symbol.toUpperCase();
      console.log(`📊 Fetching expiries for ${upperSymbol}...`);

      const response = await this.rateLimitedApiCall(() =>
        axios.get(
          `https://api.dhan.co/v2/expiry`,
          {
            params: {
              underlying: upperSymbol,
            },
            headers: {
              'access-token': this.sessionToken!,
              'client-id': this.config.clientId,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        )
      );

      console.log(`✅ Expiries received for ${upperSymbol}`);
      
      // Extract expiry dates from response and convert to YYYY-MM-DD format
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map((expiry: any) => {
          // Convert DD-MMM-YYYY to YYYY-MM-DD
          return this.parseExpiryFromDhan(expiry.expiryDate || expiry);
        });
      }
      
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Failed to fetch expiries:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  }
}

/**
 * Get Dhan stream instance
 */
export function getDhanStream() {
  try {
    const config: DhanConfig = {
      apiKey: process.env.DHAN_API_KEY || '',
      apiSecret: process.env.DHAN_API_SECRET || '',
      accessToken: process.env.DHAN_ACCESS_TOKEN || '', // Use the JWT access token
      clientId: process.env.DHAN_CLIENT_ID || '',
      feedUrl: process.env.DHAN_FEED_URL,
    };

    if (!config.clientId) {
      throw new Error('Dhan API credentials not configured. Set DHAN_CLIENT_ID in .env');
    }

    if (!config.accessToken && !config.apiSecret) {
      throw new Error('No access token or API secret provided. Set DHAN_ACCESS_TOKEN in .env');
    }

    const client = new DhanClient(config);
    return client;
  } catch (error) {
    console.error('Failed to initialize Dhan client:', error);
    throw error;
  }
}
