'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PortfolioData } from '@/lib/types'

interface PortfolioSummaryProps {
  data: PortfolioData
}

export function PortfolioSummary({ data }: PortfolioSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            Current total balance across all accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Change</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.totalChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(data.totalChange24h)}
          </div>
          <p className="text-xs text-muted-foreground">
            Portfolio performance in the last 24 hours
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spot Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.accounts.spot?.totalValue || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Available in spot trading account
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.accounts.spot?.balances.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Number of assets in portfolio
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
