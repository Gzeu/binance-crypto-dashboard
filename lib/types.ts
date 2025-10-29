// TypeScript type definitions for the Binance Dashboard

export interface BalanceData {
  asset: string;
  free: number;
  locked: number;
  total: number;
  priceUSDT: number;
  valueUSDT: number;
  isFutures?: boolean;
  change24h?: number;
  allocation?: number;
  unrealizedProfit?: number;
  marginLevel?: number;
  positionAmt?: number;
  entryPrice?: number;
  markPrice?: number;
  leverage?: number;
}

export type AccountType = 'spot' | 'margin' | 'futures' | 'earn' | 'funding';

export interface AccountBalance {
  type: AccountType;
  balances: BalanceData[];
  totalValue: number;
  totalChange24h: number;
  timestamp: string;
}

export interface PortfolioData {
  accounts: {
    spot: AccountBalance;
    margin: AccountBalance;
    futures: AccountBalance;
    // Add other account types if needed
  };
  totalValue: number;
  totalChange24h: number;
  timestamp: string;
  performance: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// For backward compatibility
export type AssetBalance = BalanceData;

export interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: {
    asset: string;
    free: string;
    locked: string;
  }[];
  permissions: string[];
}

export interface BinancePrices {
  [symbol: string]: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface PriceHistoryData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetInfo {
  symbol: string;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
}

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof BalanceData;
  direction: SortDirection;
}

export interface FilterConfig {
  searchTerm: string;
  minValue: number;
  showZeroBalances: boolean;
}
