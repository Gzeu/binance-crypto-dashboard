'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PortfolioData } from '@/lib/types'
import { ChartDataPersistence } from '@/lib/chart-persistence'
import { ChartPoint, ChartConfig } from '@/lib/chart-types'
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, PieChart, Trash2 } from 'lucide-react'

interface AdvancedChartProps {
  data: PortfolioData | undefined
}

export function AdvancedChart({ data }: AdvancedChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    animationDuration: 1000,
    chartType: 'area'
  })
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: ChartPoint } | null>(null)
  const animationRef = useRef<number>()

  // Initialize chart data from localStorage
  useEffect(() => {
    const savedData = ChartDataPersistence.load()
    if (savedData.length > 0) {
      setChartData(savedData)
    }
  }, [])

  useEffect(() => {
    if (!data) return

    const spotValue = parseFloat(data.totalSpotUSDT || '0');
    const futuresValue = parseFloat(data.totalFuturesUSDT || '0');
    const marginValue = parseFloat(data.totalMarginUSDT || '0');
    const totalValue = parseFloat(data.totalPortfolioUSDT || '0');
    const pnlValue = parseFloat(data.totalUnrealizedPnL || '0');

    const newPoint: ChartPoint = {
      timestamp: Date.now(),
      spot: spotValue,
      futures: futuresValue,
      margin: marginValue,
      total: totalValue,
      unrealizedPnL: pnlValue
    }

    setChartData(prev => {
      const updated = [...prev, newPoint]
      // Keep last 100 points for better visualization
      const finalData = updated.slice(-100)
      // Save to localStorage
      ChartDataPersistence.save(finalData)
      return finalData
    })
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = { top: 60, right: 200, bottom: 80, left: 80 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Clear canvas with smooth fade effect
    ctx.fillStyle = 'rgba(248, 250, 252, 0.95)'
    ctx.fillRect(0, 0, width, height)

    if (chartData.length < 2) {
      // Draw "Loading data..." message
      ctx.fillStyle = '#64748b'
      ctx.font = '16px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }

    // Calculate scales with better range
    const allValues = chartData.flatMap(d => [d.total, d.spot, d.futures, d.margin])
    const maxValue = Math.max(...allValues) * 1.05 // Add 5% padding
    const minValue = 0
    const xScale = chartWidth / (chartData.length - 1)
    const yScale = chartHeight / (maxValue - minValue)

    // Draw enhanced grid
    if (chartConfig.showGrid) {
      // Subtle grid
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 0.5
      ctx.setLineDash([3, 3])
      
      // More grid lines for better readability
      for (let i = 0; i <= 8; i++) {
        const y = padding.top + (chartHeight / 8) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(padding.left + chartWidth, y)
        ctx.stroke()
      }

      for (let i = 0; i <= 12; i++) {
        const x = padding.left + (chartWidth / 12) * i
        ctx.beginPath()
        ctx.moveTo(x, padding.top)
        ctx.lineTo(x, padding.top + chartHeight)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    // Draw axes with better styling
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, padding.top + chartHeight)
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.stroke()

    // Enhanced gradients
    const totalGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    totalGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)')
    totalGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)')
    totalGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)')

    const futuresGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    futuresGradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)')
    futuresGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)')
    futuresGradient.addColorStop(1, 'rgba(245, 158, 11, 0.02)')

    const pnlGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    const lastPnL = chartData[chartData.length - 1]?.unrealizedPnL || 0
    if (lastPnL >= 0) {
      pnlGradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
      pnlGradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)')
    } else {
      pnlGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)')
      pnlGradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)')
    }

    // Draw P&L area with enhanced visibility
    if (chartConfig.chartType === 'area' && chartData.some(d => d.unrealizedPnL !== 0)) {
      ctx.fillStyle = pnlGradient
      ctx.beginPath()
      
      chartData.forEach((point, index) => {
        const x = padding.left + index * xScale
        const baseY = padding.top + chartHeight - (chartData[0].total - minValue) * yScale
        const pnlY = padding.top + chartHeight - ((point.total + point.unrealizedPnL) - minValue) * yScale
        
        if (index === 0) {
          ctx.moveTo(x, baseY)
          ctx.lineTo(x, pnlY)
        } else {
          ctx.lineTo(x, pnlY)
        }
      })
      
      for (let i = chartData.length - 1; i >= 0; i--) {
        const x = padding.left + i * xScale
        const baseY = padding.top + chartHeight - (chartData[0].total - minValue) * yScale
        ctx.lineTo(x, baseY)
      }
      
      ctx.closePath()
      ctx.fill()
    }

    // Draw futures area for better visibility
    if (chartConfig.chartType === 'area') {
      ctx.fillStyle = futuresGradient
      ctx.beginPath()
      
      chartData.forEach((point, index) => {
        const x = padding.left + index * xScale
        const y = padding.top + chartHeight - ((point.spot + point.futures) - minValue) * yScale
        
        if (index === 0) {
          ctx.moveTo(x, padding.top + chartHeight)
          ctx.lineTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.lineTo(padding.left + (chartData.length - 1) * xScale, padding.top + chartHeight)
      ctx.closePath()
      ctx.fill()
    }

    // Draw total portfolio area
    if (chartConfig.chartType === 'area') {
      ctx.fillStyle = totalGradient
      ctx.beginPath()
      
      chartData.forEach((point, index) => {
        const x = padding.left + index * xScale
        const y = padding.top + chartHeight - (point.total - minValue) * yScale
        
        if (index === 0) {
          ctx.moveTo(x, padding.top + chartHeight)
          ctx.lineTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.lineTo(padding.left + (chartData.length - 1) * xScale, padding.top + chartHeight)
      ctx.closePath()
      ctx.fill()
    }

    // Enhanced line drawing with better visibility
    const drawLine = (values: number[], color: string, lineWidth: number = 2, dashArray?: number[], shadow?: boolean) => {
      if (shadow) {
        ctx.shadowColor = color
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 2
      }
      
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      if (dashArray) {
        ctx.setLineDash(dashArray)
      }
      ctx.beginPath()
      
      values.forEach((value, index) => {
        const x = padding.left + index * xScale
        const y = padding.top + chartHeight - (value - minValue) * yScale
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
      ctx.setLineDash([])
      ctx.shadowBlur = 0
    }

    // Draw lines with enhanced visibility
    drawLine(chartData.map(d => d.total), '#3b82f6', 4, undefined, true) // Thicker main line with shadow
    drawLine(chartData.map(d => d.futures), '#f59e0b', 3, undefined, true) // Emphasized futures line
    drawLine(chartData.map(d => d.spot), '#10b981', 2)
    drawLine(chartData.map(d => d.margin), '#ef4444', 2)

    // Enhanced data points
    chartData.forEach((point, index) => {
      const x = padding.left + index * xScale
      const y = padding.top + chartHeight - (point.total - minValue) * yScale
      
      // Draw points for all recent data
      if (index >= chartData.length - 15) {
        // Outer glow
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()
        
        // Inner point
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Special highlight for futures balance points
      if (index >= chartData.length - 15 && point.futures > 0) {
        const futuresY = padding.top + chartHeight - (point.futures - minValue) * yScale
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(x, futuresY, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    // Enhanced labels
    ctx.fillStyle = '#475569'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    
    // Y-axis labels with better formatting
    for (let i = 0; i <= 6; i++) {
      const value = minValue + (maxValue - minValue) * (1 - i / 6)
      const y = padding.top + (chartHeight / 6) * i
      ctx.textAlign = 'right'
      ctx.fillText(formatCurrency(value), padding.left - 10, y + 4)
    }

    // X-axis labels
    ctx.textAlign = 'center'
    const labelInterval = Math.max(1, Math.floor(chartData.length / 8))
    chartData.forEach((point, index) => {
      if (index % labelInterval === 0 || index === chartData.length - 1) {
        const x = padding.left + index * xScale
        ctx.fillText(formatTime(point.timestamp), x, height - 20)
      }
    })

    // Enhanced title
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Portfolio Balance - Real Time', padding.left, 30)

    // Enhanced legend with futures emphasis
    if (chartConfig.showLegend) {
      const legends = [
        { color: '#3b82f6', label: 'Total Portfolio', icon: BarChart3, emphasis: true },
        { color: '#f59e0b', label: `Futures ($${(chartData[chartData.length - 1]?.futures || 0).toLocaleString()})`, icon: TrendingUp, emphasis: true },
        { color: '#10b981', label: 'Spot', icon: DollarSign },
        { color: '#ef4444', label: 'Margin', icon: PieChart }
      ]

      legends.forEach((legend, index) => {
        const x = width - 190
        const y = 70 + index * 28
        
        // Background for emphasis
        if (legend.emphasis) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'
          ctx.fillRect(x - 5, y - 12, 180, 24)
        }
        
        // Color box with glow for emphasis
        if (legend.emphasis) {
          ctx.shadowColor = legend.color
          ctx.shadowBlur = 3
        }
        ctx.fillStyle = legend.color
        ctx.fillRect(x, y - 8, legend.emphasis ? 20 : 16, legend.emphasis ? 20 : 16)
        ctx.shadowBlur = 0
        
        // Text
        ctx.fillStyle = legend.emphasis ? '#1e293b' : '#475569'
        ctx.font = legend.emphasis ? 'bold 13px system-ui, -apple-system, sans-serif' : '12px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(legend.label, x + (legend.emphasis ? 24 : 20), y + 4)
      })
    }

    // Enhanced statistics box
    const currentTotal = chartData[chartData.length - 1]?.total || 0
    const previousTotal = chartData[chartData.length - 2]?.total || 0
    const change = currentTotal - previousTotal
    const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0
    const currentFutures = chartData[chartData.length - 1]?.futures || 0
    const currentSpot = chartData[chartData.length - 1]?.spot || 0

    const statsY = height - 70
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(padding.left, statsY, 450, 60)
    
    // Border
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(padding.left, statsY, 450, 60)
    
    // Enhanced stats text
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Total: ${formatCurrency(currentTotal)}`, padding.left + 10, statsY + 20)
    
    ctx.fillStyle = change >= 0 ? '#10b981' : '#ef4444'
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Change: ${formatCurrency(change)} (${formatPercentage(changePercent)})`, padding.left + 10, statsY + 40)
    
    // Futures balance emphasis
    ctx.fillStyle = '#f59e0b'
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Futures: ${formatCurrency(currentFutures)}`, padding.left + 220, statsY + 20)
    
    ctx.fillStyle = '#10b981'
    ctx.fillText(`Spot: ${formatCurrency(currentSpot)}`, padding.left + 220, statsY + 40)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = 400 * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = '400px'
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
      
      drawChart()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [chartData, chartConfig])

  useEffect(() => {
    const animate = () => {
      drawChart()
      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation with a small delay for smooth initial render
    const startAnimation = () => {
      setTimeout(() => {
        animate()
      }, 100)
    }

    startAnimation()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [chartData, chartConfig])

  // Smooth data updates with transition
  useEffect(() => {
    if (chartData.length > 0) {
      // Smooth transition when new data arrives
      const transitionDuration = 300
      const startTime = Date.now()
      
      const smoothUpdate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / transitionDuration, 1)
        
        // Use easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        if (progress < 1) {
          requestAnimationFrame(smoothUpdate)
        }
      }
      
      smoothUpdate()
    }
  }, [chartData])

  const handleClearData = () => {
    ChartDataPersistence.clear()
    setChartData([])
  }

  const dataAge = ChartDataPersistence.getDataAge()
  const isDataFresh = ChartDataPersistence.isDataFresh()

  const currentTotal = chartData[chartData.length - 1]?.total || 0
  const previousTotal = chartData[chartData.length - 2]?.total || 0
  const change = currentTotal - previousTotal
  const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0
  const currentPnL = chartData[chartData.length - 1]?.unrealizedPnL || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Advanced Portfolio Chart
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={change >= 0 ? "default" : "destructive"}>
              {change >= 0 ? '+' : ''}{formatCurrency(change)} ({formatPercentage(changePercent)})
            </Badge>
            <Badge variant={currentPnL >= 0 ? "default" : "destructive"}>
              P&L: {currentPnL >= 0 ? '+' : ''}{formatCurrency(currentPnL)}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time portfolio tracking with advanced visualization and analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Controls */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showGrid"
                  checked={chartConfig.showGrid}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="showGrid" className="text-sm">Grid</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLegend"
                  checked={chartConfig.showLegend}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="showLegend" className="text-sm">Legend</label>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="chartType" className="text-sm">Type:</label>
                <select
                  id="chartType"
                  value={chartConfig.chartType}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, chartType: e.target.value as any }))}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="area">Area</option>
                  <option value="line">Line</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {chartData.length} points • {dataAge < 1 ? 'Fresh' : `${dataAge.toFixed(1)}h old`}
              </div>
              <button
                onClick={handleClearData}
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 h-7"
                title="Clear chart data"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full border rounded-lg"
              style={{ height: '400px' }}
            />
            
            {/* Tooltip */}
            {hoveredPoint && chartConfig.showTooltip && (
              <div
                ref={tooltipRef}
                className="absolute bg-black text-white p-2 rounded text-xs pointer-events-none z-10"
                style={{
                  left: hoveredPoint.x,
                  top: hoveredPoint.y - 40
                }}
              >
                <div>Total: {formatCurrency(hoveredPoint.data.total)}</div>
                <div>Time: {formatTime(hoveredPoint.data.timestamp)}</div>
                <div>P&L: {formatCurrency(hoveredPoint.data.unrealizedPnL)}</div>
              </div>
            )}
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Current Value</div>
              <div className="text-lg font-bold">{formatCurrency(currentTotal)}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">24h Change</div>
              <div className={`text-lg font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{formatCurrency(change)}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Change %</div>
              <div className={`text-lg font-bold ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(changePercent)}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Unrealized P&L</div>
              <div className={`text-lg font-bold ${currentPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentPnL >= 0 ? '+' : ''}{formatCurrency(currentPnL)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
