'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Shield, Clock } from "lucide-react"
import { PortfolioData } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface AccountTabsProps {
  data: PortfolioData
  activeTab?: 'spot' | 'margin' | 'futures' | 'total'
  onTabChange?: (tab: 'spot' | 'margin' | 'futures' | 'total') => void
}

export function AccountTabs({ data, activeTab = 'total', onTabChange }: AccountTabsProps) {
  const totalValue = Number(data.totalPortfolioUSDT || 0)
  const assetCount = data.balances.length
  const isCached = Boolean(data.cached)

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) => onTabChange?.(value as 'spot' | 'margin' | 'futures' | 'total')}
      className="w-full space-y-4"
      defaultValue={activeTab}
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="total">
          <span className="hidden sm:inline">Total </span>Overview
        </TabsTrigger>
        <TabsTrigger value="spot">Spot</TabsTrigger>
        <TabsTrigger value="margin">Margin</TabsTrigger>
        <TabsTrigger value="futures">Futures</TabsTrigger>
      </TabsList>

      <TabsContent value="total" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Portfolio Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-muted-foreground">
              {assetCount} active assets
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="spot" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Spot Summary</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <div className="text-sm text-muted-foreground">All balances are currently sourced from the spot endpoint.</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="margin" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Margin Status</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Not connected</div>
            <div className="text-sm text-muted-foreground">Margin balances are not included in the current API response.</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="futures" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Futures Status</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Not connected</div>
            <div className="text-sm text-muted-foreground">
              {isCached ? 'Latest response is currently served from cache.' : 'No futures data is returned by the current API route.'}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
