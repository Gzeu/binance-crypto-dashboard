'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { Loader2, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PortfolioSummary } from '@/components/portfolio-summary'
import type { PortfolioData } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

// Dynamic imports for components that cause hydration issues
const AssetTable = dynamic(() => import('@/components/asset-table'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-32 rounded-lg" />
})

const AllocationChart = dynamic(() => import('@/components/allocation-chart'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-64 rounded-lg" />
})

const LastUpdated = dynamic(() => import('@/components/last-updated'), { 
  ssr: false,
  loading: () => <span className="text-sm text-muted-foreground">Loading...</span>
})

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<PortfolioData>(
    '/api/binance-balance',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  const handleRefresh = () => {
    mutate()
  }

  const handleExportCSV = () => {
    if (data?.balances) {
      exportToCSV(data.balances, 'binance-portfolio.csv')
    }
  }

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Binance Portfolio</h1>
          <Suspense fallback={<span className="text-sm text-muted-foreground">Loading...</span>}>
            <LastUpdated data={data} />
          </Suspense>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            onClick={handleExportCSV}
            disabled={!data?.balances || isLoading}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
          {/* Portfolio Summary */}
          <PortfolioSummary data={data} />

          {/* Charts and Table with Suspense boundaries */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-lg" />}>
                <AssetTable balances={data.balances || []} />
              </Suspense>
            </div>
            
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-lg" />}>
                <AllocationChart balances={data.balances || []} />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </div>
  )
}