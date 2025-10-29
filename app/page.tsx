'use client'

import { Suspense, useState } from 'react'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { Loader2, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountTabs } from '@/components/account-tabs'
// PerformanceMetrics component is not available, will be implemented later
import type { PortfolioData } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

// Dynamic imports for components that cause hydration issues
// Fix: Use proper import syntax for named exports
const AssetTable = dynamic(() => import('@/components/asset-table').then(mod => ({ default: mod.AssetTable })), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-32 rounded-lg" />
})

const AllocationChart = dynamic(() => import('@/components/allocation-chart').then(mod => ({ default: mod.AllocationChart })), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-64 rounded-lg" />
})

const LastUpdated = dynamic(() => import('@/components/last-updated').then(mod => ({ default: mod.LastUpdated })), { 
  ssr: false,
  loading: () => <span className="text-sm text-muted-foreground">Loading...</span>
})

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ApiResponse {
  success: boolean;
  data: PortfolioData;
  timestamp: string;
}

export default function Dashboard() {
  const { data: response, error, isLoading, mutate } = useSWR<ApiResponse>(
    '/api/binance-balance',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )
  
  // Extract the portfolio data from the API response
  const data = response?.data
  const totalBalance = data?.totalValue || 0
  const spotBalance = data?.accounts.spot?.totalValue || 0

  const handleRefresh = () => {
    mutate()
  }

  const handleExportCSV = () => {
    if (data) {
      // Flatten all account balances into a single array
      const allBalances = Object.values(data.accounts).flatMap(account => account.balances)
      exportToCSV(allBalances, 'binance-portfolio.csv')
    }
  }
  
  // Log the data for debugging
  console.log('API Response:', response)
  console.log('Portfolio Data:', data)

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">API Error</CardTitle>
            <CardDescription>
              {error.message || 'Failed to load portfolio data. Please check your API configuration.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState<'total' | 'spot' | 'margin' | 'futures'>('total')

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Binance Portfolio</h1>
          <Suspense fallback={<span className="text-sm text-muted-foreground">Loading...</span>}>
            <LastUpdated data={data} />
          </Suspense>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="h-9"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          
          <Button
            onClick={handleExportCSV}
            disabled={!data?.accounts?.spot?.balances || isLoading}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-pulse bg-muted h-64 rounded-lg" />
          <div className="animate-pulse bg-muted h-64 rounded-lg" />
        </div>
      )}

      {/* Content */}
      {data && (
        <>
          {/* Account Tabs */}
          <AccountTabs 
            data={data} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Allocation Chart */}
          <div className="grid gap-6">
            <div className="h-80">
              <AllocationChart 
                balances={data.accounts.spot?.balances || []}
                className="h-full"
              />
            </div>
            
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>24h change: {data.totalChange24h > 0 ? '+' : ''}{data.totalChange24h.toFixed(2)}%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>

          {/* Asset Tables */}
          <div className="space-y-6">
            {activeTab === 'total' ? (
              // Show all account types in separate tables
              Object.entries(data.accounts).map(([type, account]) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {type.charAt(0).toUpperCase() + type.slice(1)} Assets
                  </h3>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-lg" />}>
                    <AssetTable 
                      balances={account.balances} 
                      accountType={type as 'spot' | 'margin' | 'futures' | 'earn' | 'funding'}
                    />
                  </Suspense>
                </div>
              ))
            ) : (
              // Show only the selected account type
              <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-lg" />}>
                <AssetTable 
                  balances={data.accounts[activeTab as 'spot' | 'margin' | 'futures']?.balances || []}
                  accountType={activeTab as 'spot' | 'margin' | 'futures' | 'earn' | 'funding'}
                />
              </Suspense>
            )}
          </div>
        </>
      )}
    </div>
  )
}