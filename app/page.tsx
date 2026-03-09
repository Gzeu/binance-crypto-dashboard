'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { Loader2, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PortfolioData } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

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

const fetcher = async (url: string): Promise<PortfolioData> => {
  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(json?.error || 'Failed to load portfolio data')
  }

  return json as PortfolioData
}

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

  const totalBalance = Number(data?.totalPortfolioUSDT || 0)

  const handleRefresh = () => {
    mutate()
  }

  const handleExportCSV = () => {
    if (data?.balances?.length) {
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
    <div className="container mx-auto p-4 md:p-6 space-y-6">
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
            disabled={!data?.balances?.length || isLoading}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {isLoading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-pulse bg-muted h-64 rounded-lg" />
          <div className="animate-pulse bg-muted h-64 rounded-lg" />
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Portfolio</CardTitle>
                <CardDescription>Current value of all holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
                <CardDescription>Holdings with non-zero balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.balances.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Trading permission from Binance account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data.canTrade ? 'text-green-600' : 'text-red-600'}`}>
                  {data.canTrade ? 'Active' : 'Restricted'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <div className="h-80">
              <AllocationChart
                balances={data.balances}
                className="h-full"
              />
            </div>

            <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-lg" />}>
              <AssetTable
                balances={data.balances}
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
  )
}
