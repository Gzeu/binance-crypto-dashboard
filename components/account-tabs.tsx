'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { PortfolioData } from "@/lib/types"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface AccountTabsProps {
  data: PortfolioData
  activeTab?: 'spot' | 'margin' | 'futures' | 'total'
  onTabChange?: (tab: 'spot' | 'margin' | 'futures' | 'total') => void
}

export function AccountTabs({ data, activeTab = 'total', onTabChange }: AccountTabsProps) {
  const { accounts, totalValue, totalChange24h } = data
  const isPositive = totalChange24h >= 0

  return (
    <Tabs 
      value={activeTab}
      onValueChange={(value: string) => onTabChange?.(value as any)}
      className="w-full space-y-4"
      defaultValue={activeTab}
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="total">
          <span className="hidden sm:inline">Total </span>Equity
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
            <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {isPositive ? '+' : ''}{formatPercentage(totalChange24h)} (24h)
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {Object.entries(accounts).map(([type, account]) => (
        <TabsContent key={type} value={type} className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {type.charAt(0).toUpperCase() + type.slice(1)} Balance
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(account.totalValue)}
              </div>
              <div className={`flex items-center text-sm ${account.totalChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {account.totalChange24h >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {account.totalChange24h >= 0 ? '+' : ''}{formatPercentage(account.totalChange24h)} (24h)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
