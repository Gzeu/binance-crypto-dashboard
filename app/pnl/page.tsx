"use client"

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PnlTab() {
  const [range, setRange] = useState<'7d'|'30d'|'90d'|'ytd'>('30d')
  const to = new Date()
  const from = useMemo(() => {
    const d = new Date()
    if (range === '7d') d.setDate(d.getDate() - 7)
    else if (range === '30d') d.setDate(d.getDate() - 30)
    else if (range === '90d') d.setDate(d.getDate() - 90)
    else { d.setMonth(0); d.setDate(1) }
    return d
  }, [range])

  const { data, isLoading, error, mutate } = useSWR(`/api/pnl?from=${from.toISOString()}&to=${to.toISOString()}`, fetcher, { refreshInterval: 60000 })

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>PnL</CardTitle>
        <div className="flex gap-2">
          {(['7d','30d','90d','ytd'] as const).map(r => (
            <Button key={r} variant={r===range?'default':'outline'} onClick={() => setRange(r)}>{r.toUpperCase()}</Button>
          ))}
          <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-destructive">{error.message || 'Failed to load PnL'}</div>}
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-md border">
              <div className="text-sm text-muted-foreground">Realized PnL</div>
              <div className="text-2xl font-semibold">${data?.data?.realizedPnlUSD?.toFixed(2) ?? '0.00'}</div>
            </div>
            <div className="p-4 rounded-md border">
              <div className="text-sm text-muted-foreground">Unrealized PnL</div>
              <div className="text-2xl font-semibold">${data?.data?.unrealizedPnlUSD?.toFixed(2) ?? '0.00'}</div>
            </div>
            <div className="p-4 rounded-md border">
              <div className="text-sm text-muted-foreground">ROI</div>
              <div className="text-2xl font-semibold">{data?.data?.roiPct?.toFixed(2) ?? '0.00'}%</div>
            </div>
            <div className="p-4 rounded-md border">
              <div className="text-sm text-muted-foreground">Fees</div>
              <div className="text-2xl font-semibold">${data?.data?.feesUSD?.toFixed(2) ?? '0.00'}</div>
            </div>
          </div>
        )}
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Top Symbols (Realized PnL)</div>
          <div className="space-y-2">
            {data?.data?.breakdown?.slice(0,8)?.map((b:any) => (
              <div key={b.symbol} className="flex items-center justify-between border rounded-md p-2">
                <div className="font-medium">{b.symbol}</div>
                <div className={b.realizedPnlUSD>=0? 'text-green-600':'text-red-600'}>
                  ${b.realizedPnlUSD.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
