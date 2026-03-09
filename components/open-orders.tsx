'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { OpenOrder } from '@/lib/types'
import { Clock, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'

interface OpenOrdersProps {
  orders: OpenOrder[]
}

export function OpenOrders({ orders }: OpenOrdersProps) {
  const formatNumber = (num: string, decimals: number = 6) => {
    return parseFloat(num).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const formatCurrency = (num: string) => {
    return `$${parseFloat(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getOrderTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'limit':
        return 'bg-blue-500'
      case 'market':
        return 'bg-green-500'
      case 'stop_loss':
        return 'bg-red-500'
      case 'stop_loss_limit':
        return 'bg-orange-500'
      case 'take_profit':
        return 'bg-purple-500'
      case 'take_profit_limit':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'partially_filled':
        return 'bg-yellow-100 text-yellow-800'
      case 'filled':
        return 'bg-green-100 text-green-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'pending_cancel':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSideIcon = (side: string) => {
    return side.toLowerCase() === 'buy' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getSideColor = (side: string) => {
    return side.toLowerCase() === 'buy' ? 'text-green-600' : 'text-red-600'
  }

  const calculateFillPercentage = (order: OpenOrder) => {
    const executed = parseFloat(order.executedQty)
    const original = parseFloat(order.origQty)
    if (original === 0) return 0
    return (executed / original) * 100
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Open Orders
          </CardTitle>
          <CardDescription>Active trading orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No open orders
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group orders by symbol
  const ordersBySymbol = orders.reduce((acc, order) => {
    if (!acc[order.symbol]) {
      acc[order.symbol] = []
    }
    acc[order.symbol].push(order)
    return acc
  }, {} as Record<string, OpenOrder[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Open Orders ({orders.length})
        </CardTitle>
        <CardDescription>Active trading orders across all markets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(ordersBySymbol).map(([symbol, symbolOrders]) => (
            <div key={symbol} className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">{symbol}</h3>
              <div className="space-y-3">
                {symbolOrders.map((order) => (
                  <div key={order.orderId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSideIcon(order.side)}
                        <span className={`font-medium ${getSideColor(order.side)}`}>
                          {order.side.toUpperCase()}
                        </span>
                        <Badge className={`${getOrderTypeColor(order.type)} text-white text-xs`}>
                          {order.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(order.price)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(order.origQty)} {symbol.replace('USDT', '').replace('BUSD', '')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Executed</div>
                        <div className="font-medium">
                          {formatNumber(order.executedQty)} ({calculateFillPercentage(order).toFixed(1)}%)
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="font-medium">
                          {formatCurrency(order.cumQuote)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time in Force</div>
                        <div className="font-medium">
                          {order.timeInForce.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div className="font-medium">
                          {formatTime(order.time)}
                        </div>
                      </div>
                    </div>

                    {order.stopPrice && parseFloat(order.stopPrice) > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t text-sm">
                        <span className="text-muted-foreground">Stop Price:</span>
                        <span className="font-medium">{formatCurrency(order.stopPrice)}</span>
                      </div>
                    )}

                    {order.updateTime !== order.time && (
                      <div className="text-xs text-muted-foreground pt-1">
                        Last updated: {formatTime(order.updateTime)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
