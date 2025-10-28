'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Loader2, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PortfolioSummary } from '@/components/portfolio-summary'
import { AssetTable } from '@/components/asset-table'
import { AllocationChart } from '@/components/allocation-chart'
import type { PortfolioData, AssetBalance } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const { data, error, isLoading, mutate } = useSWR<PortfolioData>(
    '/api/binance-balance',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3,
      onSuccess: () => setLastUpdated(new Date())
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
            <CardTitle className="text-destructive">Error Loading Portfolio</CardTitle>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
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
            Refresh
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

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading portfolio data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}
          <PortfolioSummary data={data} />

          {/* Charts and Table */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AssetTable balances={data?.balances || []} />
            </div>
            
            <div className="lg:col-span-1">
              <AllocationChart balances={data?.balances || []} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}