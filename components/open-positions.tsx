'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { OpenPosition } from '@/lib/types'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'

interface OpenPositionsProps {
  positions: OpenPosition[]
}

export function OpenPositions({ positions }: OpenPositionsProps) {
  const formatNumber = (num: string, decimals: number = 2) => {
    return parseFloat(num).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const formatCurrency = (num: string) => {
    const value = parseFloat(num)
    return `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getProfitColor = (profit: string) => {
    const value = parseFloat(profit)
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getProfitBgColor = (profit: string) => {
    const value = parseFloat(profit)
    if (value > 0) return 'bg-green-100 text-green-800'
    if (value < 0) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getLeverageColor = (leverage: string) => {
    const lev = parseFloat(leverage)
    if (lev >= 10) return 'bg-red-500'
    if (lev >= 5) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const calculateROE = (position: OpenPosition) => {
    const unrealizedProfit = parseFloat(position.unRealizedProfit)
    const notional = parseFloat(position.notional)
    if (notional === 0) return '0.00'
    const roe = (unrealizedProfit / Math.abs(notional)) * 100
    return roe.toFixed(2)
  }

  const calculateLiquidationDistance = (position: OpenPosition) => {
    const entryPrice = parseFloat(position.entryPrice)
    const liquidationPrice = parseFloat(position.liquidationPrice)
    const markPrice = parseFloat(position.markPrice)
    
    if (entryPrice === 0 || liquidationPrice === 0) return '0.00'
    
    const distance = ((markPrice - liquidationPrice) / entryPrice) * 100
    return distance.toFixed(2)
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Open Positions
          </CardTitle>
          <CardDescription>Futures trading positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No open positions
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unRealizedProfit), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Open Positions
          </div>
          <Badge className={getProfitBgColor(totalUnrealizedPnL.toString())}>
            {formatCurrency(totalUnrealizedPnL.toString())}
          </Badge>
        </CardTitle>
        <CardDescription>Futures trading positions and P&L</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => (
            <div key={position.symbol} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{position.symbol}</h3>
                  <Badge className={`${getLeverageColor(position.leverage)} text-white text-xs`}>
                    {position.leverage}x
                  </Badge>
                  <Badge variant="outline">
                    {position.marginType}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getProfitColor(position.unRealizedProfit)}`}>
                    {formatCurrency(position.unRealizedProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ROE: {calculateROE(position)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Position Size</div>
                  <div className="font-medium">
                    {formatNumber(position.positionAmt)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Entry Price</div>
                  <div className="font-medium">
                    ${formatNumber(position.entryPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mark Price</div>
                  <div className="font-medium">
                    ${formatNumber(position.markPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Notional</div>
                  <div className="font-medium">
                    ${formatNumber(position.notional)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    Liq. Price: ${formatNumber(position.liquidationPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({calculateLiquidationDistance(position)}% away)
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Side: {position.positionSide}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
