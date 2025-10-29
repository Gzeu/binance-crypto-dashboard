export interface AssetBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  priceUSDT: string;
  valueUSDT: string;
}

export interface PortfolioData {
  balances: AssetBalance[];
  totalPortfolioUSDT: string;
  accountType: string;
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
