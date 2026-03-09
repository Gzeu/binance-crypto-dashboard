import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AssetBalance } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value === 0) return '$0.00'
  if (value < 0.01) return `$${value.toFixed(8)}`
  if (value < 1) return `$${value.toFixed(4)}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero'
  }).format(value / 100)

  return formatted
}

export function formatNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(2)
}

export function exportToCSV(balances: AssetBalance[], filename: string = 'portfolio.csv'): void {
  const headers = ['Asset', 'Balance', 'Price (USDT)', 'Value (USDT)', 'Allocation (%)']

  const totalValue = balances.reduce((sum, balance) => sum + parseFloat(balance.valueUSDT || '0'), 0)

  const rows = balances
    .filter(balance => parseFloat(balance.valueUSDT || '0') > 0)
    .sort((a, b) => parseFloat(b.valueUSDT || '0') - parseFloat(a.valueUSDT || '0'))
    .map(balance => {
      const total = parseFloat(balance.total || '0')
      const priceUSDT = parseFloat(balance.priceUSDT || '0')
      const valueUSDT = parseFloat(balance.valueUSDT || '0')

      return [
        balance.asset,
        total.toFixed(8),
        priceUSDT.toFixed(2),
        valueUSDT.toFixed(2),
        (totalValue > 0 ? ((valueUSDT / totalValue) * 100) : 0).toFixed(2)
      ]
    })

  rows.push(['', '', 'TOTAL:', totalValue.toFixed(2), '100.00'])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getAssetLogoUrl(asset: string): string {
  return `https://cryptoicons.org/api/icon/${asset.toLowerCase()}/200`
}

export function calculateAllocations(balances: AssetBalance[]): Array<AssetBalance & { percentage: number }> {
  const totalValue = balances.reduce((sum, balance) => sum + parseFloat(balance.valueUSDT || '0'), 0)

  return balances
    .filter(balance => parseFloat(balance.valueUSDT || '0') > 0)
    .map(balance => ({
      ...balance,
      percentage: totalValue > 0 ? (parseFloat(balance.valueUSDT || '0') / totalValue) * 100 : 0
    }))
    .sort((a, b) => parseFloat(b.valueUSDT || '0') - parseFloat(a.valueUSDT || '0'))
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (i === maxRetries) {
        throw lastError
      }

      const delay = baseDelay * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
