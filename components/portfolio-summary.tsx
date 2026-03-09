'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PortfolioData } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface PortfolioSummaryProps {
  data: PortfolioData
}

export function PortfolioSummary({ data }: PortfolioSummaryProps) {
  const totalPortfolioValue = parseFloat(data.totalPortfolioUSDT || '0')
  const activeAssets = data.balances.length
  const cacheLabel = data.cached ? 'Cached response' : 'Live response'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
          <p className="text-xs text-muted-foreground">
            Current total balance across all tracked assets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.canTrade ? 'text-green-600' : 'text-red-600'}`}>
            {data.canTrade ? 'Active' : 'Restricted'}
          </div>
          <p className="text-xs text-muted-foreground">
            Trading is currently {data.canTrade ? 'enabled' : 'disabled'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAssets}</div>
          <p className="text-xs text-muted-foreground">
            Number of assets with balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cacheLabel}</div>
          <p className="text-xs text-muted-foreground">
            Updated at {new Date(data.updateTime).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
