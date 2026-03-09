export interface ChartPoint {
  timestamp: number
  spot: number
  futures: number
  margin: number
  total: number
  unrealizedPnL: number
}

export interface ChartConfig {
  showGrid: boolean
  showLegend: boolean
  showTooltip: boolean
  animationDuration: number
  chartType: 'line' | 'area' | 'candlestick'
}
