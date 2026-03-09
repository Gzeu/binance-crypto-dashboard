'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PortfolioData } from '@/lib/types'
import { TrendingUp, Activity } from 'lucide-react'

interface RealTimeChartProps {
  data: PortfolioData | undefined
}

interface ChartPoint {
  timestamp: number
  spot: number
  futures: number
  margin: number
  total: number
  unrealizedPnL: number
}

export function RealTimeChart({ data }: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!data) return

    const newPoint: ChartPoint = {
      timestamp: Date.now(),
      spot: parseFloat(data.totalSpotUSDT || '0'),
      futures: parseFloat(data.totalFuturesUSDT || '0'),
      margin: parseFloat(data.totalMarginUSDT || '0'),
      total: parseFloat(data.totalPortfolioUSDT || '0'),
      unrealizedPnL: parseFloat(data.totalUnrealizedPnL || '0')
    }

    setChartData(prev => {
      const updated = [...prev, newPoint]
      // Keep only last 50 points
      return updated.slice(-50)
    })
  }, [data])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawChart = () => {
      const width = canvas.width
      const height = canvas.height

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      if (chartData.length < 2) return

      // Calculate scales
      const maxValue = Math.max(...chartData.map(d => Math.max(d.total, d.spot, d.futures, d.margin)))
      const minValue = 0
      const xScale = width / (chartData.length - 1)
      const yScale = height / (maxValue - minValue)

      // Draw grid
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      // Draw lines
      const drawLine = (values: number[], color: string, lineWidth: number = 2) => {
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        
        values.forEach((value, index) => {
          const x = index * xScale
          const y = height - (value - minValue) * yScale
          
          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        
        ctx.stroke()
      }

      // Draw total portfolio line
      drawLine(chartData.map(d => d.total), '#3b82f6', 3)
      
      // Draw individual account lines
      drawLine(chartData.map(d => d.spot), '#10b981', 2)
      drawLine(chartData.map(d => d.futures), '#f59e0b', 2)
      drawLine(chartData.map(d => d.margin), '#ef4444', 2)

      // Draw P&L area
      if (chartData.some(d => d.unrealizedPnL !== 0)) {
        ctx.fillStyle = chartData[chartData.length - 1]?.unrealizedPnL >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        ctx.beginPath()
        
        chartData.forEach((point, index) => {
          const x = index * xScale
          const baseY = height - (chartData[0].total - minValue) * yScale
          const pnlY = height - ((point.total + point.unrealizedPnL) - minValue) * yScale
          
          if (index === 0) {
            ctx.moveTo(x, baseY)
            ctx.lineTo(x, pnlY)
          } else {
            ctx.lineTo(x, pnlY)
          }
        })
        
        for (let i = chartData.length - 1; i >= 0; i--) {
          const x = i * xScale
          const baseY = height - (chartData[0].total - minValue) * yScale
          ctx.lineTo(x, baseY)
        }
        
        ctx.closePath()
        ctx.fill()
      }

      // Draw labels
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px sans-serif'
      
      // Y-axis labels
      for (let i = 0; i <= 5; i++) {
        const value = minValue + (maxValue - minValue) * (1 - i / 5)
        const y = (height / 5) * i
        ctx.fillText(`$${(value / 1000).toFixed(1)}k`, 5, y - 5)
      }

      // Legend
      const legendY = 20
      const legends = [
        { color: '#3b82f6', label: 'Total' },
        { color: '#10b981', label: 'Spot' },
        { color: '#f59e0b', label: 'Futures' },
        { color: '#ef4444', label: 'Margin' }
      ]

      legends.forEach((legend, index) => {
        const x = width - 200 + index * 50
        ctx.fillStyle = legend.color
        ctx.fillRect(x, legendY - 10, 12, 12)
        ctx.fillStyle = '#6b7280'
        ctx.fillText(legend.label, x + 16, legendY)
      })
    }

    const animate = () => {
      drawChart()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [chartData])

  const currentTotal = chartData[chartData.length - 1]?.total || 0
  const previousTotal = chartData[chartData.length - 2]?.total || 0
  const change = currentTotal - previousTotal
  const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Balance Chart
        </CardTitle>
        <CardDescription>
          Live portfolio balance tracking across all accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}${Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Unrealized P&L: </div>
              <div className={`font-medium ${(chartData[chartData.length - 1]?.unrealizedPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(chartData[chartData.length - 1]?.unrealizedPnL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full h-auto border rounded"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
