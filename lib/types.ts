export interface AssetBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  priceUSDT: string;
  valueUSDT: string;
  change24h: string;
}

export interface OpenPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  maxNotionalValue: string;
  marginType: string;
  isolatedMargin: string;
  isAutoAddMargin: string;
  positionSide: string;
  notional: string;
  isolatedWallet: string;
  updateTime: number;
}

export interface OpenOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cumQuote: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface RealTimeData {
  prices: Record<string, string>;
  timestamp: number;
}

export interface AccountBalance {
  accountType: 'spot' | 'futures' | 'margin';
  totalBalanceUSDT: string;
  availableBalanceUSDT: string;
  balances: AssetBalance[];
  marginLevel?: string;
  marginFree?: string;
  marginUsed?: string;
  maintenanceMargin?: string;
}

export interface PortfolioData {
  accounts: AccountBalance[];
  totalPortfolioUSDT: string;
  totalSpotUSDT: string;
  totalFuturesUSDT: string;
  totalMarginUSDT: string;
  openPositions: OpenPosition[];
  openOrders: OpenOrder[];
  realTimePrices: Record<string, string>;
  totalUnrealizedPnL: string;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: string;
  serverTime: string;
  cached?: boolean;
  cacheAge?: number;
}

export interface BinanceError {
  error: string;
  code: string;
  timestamp: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface AssetTableProps {
  balances: AssetBalance[];
}

export interface AllocationChartProps {
  balances: AssetBalance[];
}

export interface PortfolioSummaryProps {
  data: PortfolioData | undefined;
}