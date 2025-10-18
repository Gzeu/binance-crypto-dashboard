import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 8
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercentage(
  value: number,
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

export function formatNumber(
  value: number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 8
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function getAssetLogo(symbol: string): string {
  const logoMap: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    BNB: 'BNB',
    ADA: 'ADA',
    DOT: 'DOT',
    LINK: 'LINK',
    LTC: 'Ł',
    XRP: 'XRP',
    BCH: 'BCH',
    EOS: 'EOS',
    TRX: 'TRX',
    XTZ: 'XTZ',
    ATOM: 'ATOM',
    NEO: 'NEO',
    IOTA: 'IOTA',
    DASH: 'DASH',
    ZEC: 'ZEC',
    XMR: 'XMR',
  };
  
  return logoMap[symbol] || symbol;
}

export function getAssetName(symbol: string): string {
  const nameMap: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    BNB: 'Binance Coin',
    ADA: 'Cardano',
    DOT: 'Polkadot',
    LINK: 'Chainlink',
    LTC: 'Litecoin',
    XRP: 'Ripple',
    BCH: 'Bitcoin Cash',
    EOS: 'EOS',
    TRX: 'TRON',
    XTZ: 'Tezos',
    ATOM: 'Cosmos',
    NEO: 'Neo',
    IOTA: 'IOTA',
    DASH: 'Dash',
    ZEC: 'Zcash',
    XMR: 'Monero',
  };
  
  return nameMap[symbol] || symbol;
}

export function validateApiCredentials(): boolean {
  return !!(
    process.env.BINANCE_API_KEY && 
    process.env.BINANCE_API_SECRET
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(error => {
    if (retries > 0) {
      return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
    }
    throw error;
  });
}

export function isValidEnvironment(): boolean {
  const requiredEnvVars = [
    'BINANCE_API_KEY',
    'BINANCE_API_SECRET',
  ];
  
  return requiredEnvVars.every(envVar => 
    process.env[envVar] && process.env[envVar]!.length > 0
  );
}