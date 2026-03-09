'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { Loader2, RefreshCw, Download, Activity, TrendingUp, TrendingDown, DollarSign, Briefcase, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PortfolioData } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

const AdvancedChart = dynamic(() => import('@/components/advanced-chart').then(mod => ({ default: mod.AdvancedChart })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/50 h-80 rounded-xl" />
})

const AccountCards = dynamic(() => import('@/components/account-cards').then(mod => ({ default: mod.AccountCards })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/50 h-32 rounded-xl" />
})

const OpenPositions = dynamic(() => import('@/components/open-positions').then(mod => ({ default: mod.OpenPositions })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/50 h-32 rounded-xl" />
})

const OpenOrders = dynamic(() => import('@/components/open-orders').then(mod => ({ default: mod.OpenOrders })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/50 h-32 rounded-xl" />
})

const AssetTable = dynamic(() => import('@/components/asset-table').then(mod => ({ default: mod.AssetTable })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/50 h-32 rounded-xl" />
})

const AllocationChart = dynamic(() => import('@/components/allocation-chart').then(mod => ({ default: mod.AllocationChart })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/50 h-64 rounded-xl" />
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
      refreshInterval: 5000,
      revalidateOnFocus: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    }
  )

  const totalBalance = Number(data?.totalPortfolioUSDT || 0)
  const accounts = data?.accounts || []
  const openPositions = data?.openPositions || []
  const openOrders = data?.openOrders || []
  const totalUnrealizedPnL = Number(data?.totalUnrealizedPnL || 0)

  const handleRefresh = () => {
    mutate()
  }

  const handleExportCSV = () => {
    if (accounts.length > 0) {
      const allBalances = accounts.flatMap(account => account.balances)
      exportToCSV(allBalances, 'crypto-portfolio-analytics.csv')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connection Error</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error.message || 'Unable to connect to portfolio service'}
              </p>
              <Button onClick={handleRefresh} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 dark:from-white via-blue-600 dark:via-blue-400 to-slate-900 dark:to-white bg-clip-text text-transparent">
                    Portfolio Analytics
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Advanced cryptocurrency portfolio monitoring
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {data && (
                  <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/20 dark:border-slate-600/20">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(data.updateTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${data.canTrade ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {data.canTrade ? 'Active' : 'Restricted'}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-white/20 dark:border-slate-600/20 hover:bg-white/70 dark:hover:bg-slate-700/70"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  onClick={handleExportCSV}
                  disabled={!accounts.length || isLoading}
                  variant="outline"
                  size="sm"
                  className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-white/20 dark:border-slate-600/20 hover:bg-white/70 dark:hover:bg-slate-700/70"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Loading State */}
          {isLoading && !data && (
            <div className="grid gap-6">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted/50 rounded-xl w-1/3"></div>
                  <div className="h-64 bg-muted/50 rounded-xl"></div>
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid gap-6 md:grid-cols-4">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Total Value
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Portfolio valuation
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                      P&L
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-3xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Unrealized profit/loss
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                      Assets
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {accounts.reduce((total, account) => total + account.balances.length, 0)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Total holdings
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                      Status
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-3xl font-bold ${data.canTrade ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {data.canTrade ? 'Active' : 'Restricted'}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Trading permissions
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Chart */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-xl">
                <AdvancedChart data={data} />
              </div>
              
              {/* Account Cards */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-xl">
                <AccountCards 
                  accounts={accounts} 
                  totalPortfolioUSDT={data.totalPortfolioUSDT}
                />
              </div>

              {/* Trading Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-xl">
                  <OpenPositions positions={openPositions} />
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-xl">
                  <OpenOrders orders={openOrders} />
                </div>
              </div>

              {/* Analytics Section */}
              <div className="grid gap-6">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-xl">
                  <div className="h-80">
                    <AllocationChart
                      balances={accounts.flatMap(account => account.balances)}
                      className="h-full"
                    />
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-xl">
                  <Suspense fallback={<div className="animate-pulse bg-muted/50 h-64 rounded-xl" />}>
                    <AssetTable
                      balances={accounts.flatMap(account => account.balances)}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
