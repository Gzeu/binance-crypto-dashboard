'use client';

import { Wallet, TrendingUp, Shield, RefreshCw } from 'lucide-react';
import { PortfolioSummaryProps } from '@/lib/types';

export function PortfolioSummary({ data }: PortfolioSummaryProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card p-6 rounded-lg border animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-4"></div>
            <div className="h-8 bg-muted rounded w-32 mb-2"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalAssets = data.balances.length;
  const tradingEnabled = data.canTrade;
  const lastUpdated = new Date(data.updateTime).toLocaleString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Portfolio Value */}
      <div className="bg-card p-6 rounded-lg border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-card-foreground">Portfolio Value</h3>
          </div>
          {data.cached && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Cached
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">
            ${parseFloat(data.totalPortfolioUSDT).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Total value in USDT
          </p>
        </div>
      </div>

      {/* Assets Count */}
      <div className="bg-card p-6 rounded-lg border hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-card-foreground">Active Assets</h3>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">
            {totalAssets}
          </div>
          <p className="text-sm text-muted-foreground">
            Holdings with balance
          </p>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-card p-6 rounded-lg border hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-card-foreground">Account Status</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              tradingEnabled ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {tradingEnabled ? 'Active' : 'Restricted'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Trading {tradingEnabled ? 'enabled' : 'disabled'}
          </p>
        </div>
      </div>
    </div>
  );
}
