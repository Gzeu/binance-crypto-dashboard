"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AssetBalance } from "@/lib/types"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface AllocationChartProps {
  balances: AssetBalance[]
  className?: string
}

export function AllocationChart({ balances, className = '' }: AllocationChartProps) {
  const chartData = useMemo(() => {
    const totalValue = balances.reduce((sum, balance) => sum + balance.valueUSDT, 0)
    
    return balances
      .filter(balance => balance.valueUSDT > 0)
      .sort((a, b) => b.valueUSDT - a.valueUSDT)
      .slice(0, 8) // Show top 8 assets
      .map((balance, index) => {
        const percentage = (balance.valueUSDT / totalValue) * 100
        const hue = (index * 137.5) % 360 // Golden angle for nice color distribution
        
        return {
          asset: balance.asset,
          value: balance.valueUSDT,
          percentage,
          color: `hsl(${hue}, 70%, 50%)`
        }
      })
  }, [balances])

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>Distribution of your crypto assets</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart representation */}
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.asset} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.asset}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatPercentage(item.percentage)}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              
              <div className="text-xs text-muted-foreground text-right">
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>
        
        {chartData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No asset data available
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Total Portfolio Value</span>
            <span>{formatCurrency(totalValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}