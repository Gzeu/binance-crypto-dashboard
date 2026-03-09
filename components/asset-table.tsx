"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AssetBalance } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface AssetTableProps {
  balances: AssetBalance[]
  accountType?: 'spot' | 'margin' | 'futures' | 'earn' | 'funding'
}

type SortKey = keyof Pick<AssetBalance, 'asset' | 'total' | 'valueUSDT' | 'priceUSDT'>
type SortDirection = 'asc' | 'desc'

export function AssetTable({ balances }: AssetTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('valueUSDT')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const getComparableValue = (balance: AssetBalance, key: SortKey): number | string => {
    if (key === 'asset') {
      return balance.asset.toLowerCase()
    }

    return parseFloat(balance[key] || '0')
  }

  const filteredAndSortedBalances = balances
    .filter(balance =>
      balance.asset.toLowerCase().includes(searchTerm.toLowerCase()) &&
      parseFloat(balance.valueUSDT || '0') > 0
    )
    .sort((a, b) => {
      const aValue = getComparableValue(a, sortKey)
      const bValue = getComparableValue(b, sortKey)

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue)
    })

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Holdings</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('asset')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Asset
                    <SortIcon column="asset" />
                  </Button>
                </th>
                <th className="text-right p-4">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('total')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Balance
                    <SortIcon column="total" />
                  </Button>
                </th>
                <th className="text-right p-4">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('priceUSDT')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Price (USDT)
                    <SortIcon column="priceUSDT" />
                  </Button>
                </th>
                <th className="text-right p-4">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('valueUSDT')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Value (USDT)
                    <SortIcon column="valueUSDT" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedBalances.map((balance) => (
                <tr key={balance.asset} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold">
                          {balance.asset.slice(0, 2)}
                        </span>
                      </div>
                      <span className="font-medium">{balance.asset}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {parseFloat(balance.total || '0').toFixed(8)}
                  </td>
                  <td className="p-4 text-right">
                    {formatCurrency(parseFloat(balance.priceUSDT || '0'))}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(parseFloat(balance.valueUSDT || '0'))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedBalances.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm ? 'No assets found matching your search.' : 'No assets with balance > 0'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
