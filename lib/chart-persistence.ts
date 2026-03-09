'use client'

import { ChartPoint } from '@/lib/chart-types'

const STORAGE_KEY = 'binance-chart-data'
const MAX_POINTS = 200 // Keep last 200 points

export class ChartDataPersistence {
  // Save data to localStorage
  static save(data: ChartPoint[]): void {
    try {
      // Only keep the most recent points
      const recentData = data.slice(-MAX_POINTS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: recentData,
        lastUpdated: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to save chart data:', error)
    }
  }

  // Load data from localStorage
  static load(): ChartPoint[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      
      // Filter out old data (older than 24 hours)
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
      const recentData = parsed.data.filter((point: ChartPoint) => 
        point.timestamp > twentyFourHoursAgo
      )

      return recentData
    } catch (error) {
      console.warn('Failed to load chart data:', error)
      return []
    }
  }

  // Clear old data
  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear chart data:', error)
    }
  }

  // Get data age in hours
  static getDataAge(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return 0

      const parsed = JSON.parse(stored)
      const age = Date.now() - parsed.lastUpdated
      return age / (60 * 60 * 1000) // Convert to hours
    } catch (error) {
      return 0
    }
  }

  // Check if data is fresh (less than 1 hour old)
  static isDataFresh(): boolean {
    return this.getDataAge() < 1
  }
}
