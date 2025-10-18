// TypeScript type definitions for the Binance Dashboard

export interface BalanceData {
  asset: string;
  free: number;
  locked: number;
  total: number;
  priceUSDT: number;
  valueUSDT: number;
  change24h?: number;
  allocation?: number;
}

export interface PortfolioData {
  balances: BalanceData[];
  totalValue: number;
  totalChange24h: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

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