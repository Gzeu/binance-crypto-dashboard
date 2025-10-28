"use client"

import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PortfolioData } from "@/lib/types"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface PortfolioSummaryProps {
  data?: PortfolioData
}

export function PortfolioSummary({ data }: PortfolioSummaryProps) {
  const totalValue = data?.totalValue || 0
  // Fix: Use totalChange24h from PortfolioData type, with fallback to change24h for compatibility
  const change24h = (data as any)?.change24h ?? data?.totalChange24h ?? 0
  const assetCount = data?.balances?.length || 0
  const nonZeroAssets = data?.balances?.filter(b => b.valueUSDT > 0).length || 0

  const isPositive = change24h >= 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            USDT equivalent
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Change</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{formatPercentage(change24h)}
          </div>
          <p className="text-xs text-muted-foreground">
            Portfolio performance
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{nonZeroAssets}</div>
          <p className="text-xs text-muted-foreground">
            Out of {assetCount} total
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Asset</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.balances?.find(b => b.valueUSDT > 0)?.asset || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Highest value asset
          </p>
        </CardContent>
      </Card>
    </div>
  )
}