'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AssetTableProps } from '@/lib/types';

type SortField = 'asset' | 'total' | 'valueUSDT' | 'priceUSDT';
type SortDirection = 'asc' | 'desc';

export function AssetTable({ balances }: AssetTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('valueUSDT');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort balances
  const filteredAndSortedBalances = useMemo(() => {
    let filtered = balances.filter((balance) =>
      balance.asset.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'asset':
          aValue = a.asset;
          bValue = b.asset;
          break;
        case 'total':
          aValue = parseFloat(a.total);
          bValue = parseFloat(b.total);
          break;
        case 'valueUSDT':
          aValue = parseFloat(a.valueUSDT);
          bValue = parseFloat(b.valueUSDT);
          break;
        case 'priceUSDT':
          aValue = parseFloat(a.priceUSDT);
          bValue = parseFloat(b.priceUSDT);
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [balances, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">Asset Holdings</h2>
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('asset')}
                  className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Asset {getSortIcon('asset')}
                </button>
              </th>
              <th className="text-right py-3 px-2">
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Balance {getSortIcon('total')}
                </button>
              </th>
              <th className="text-right py-3 px-2 hidden sm:table-cell">
                <button
                  onClick={() => handleSort('priceUSDT')}
                  className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Price {getSortIcon('priceUSDT')}
                </button>
              </th>
              <th className="text-right py-3 px-2">
                <button
                  onClick={() => handleSort('valueUSDT')}
                  className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Value {getSortIcon('valueUSDT')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedBalances.map((balance) => (
              <tr key={balance.asset} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {balance.asset.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{balance.asset}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        ${parseFloat(balance.priceUSDT).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="font-medium text-foreground">
                    {parseFloat(balance.total).toLocaleString('en-US', {
                      maximumFractionDigits: 6
                    })}
                  </div>
                  {parseFloat(balance.locked) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {parseFloat(balance.locked).toFixed(6)} locked
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 text-right hidden sm:table-cell">
                  <div className="font-medium text-foreground">
                    ${parseFloat(balance.priceUSDT).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6
                    })}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="font-medium text-foreground">
                    ${parseFloat(balance.valueUSDT).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedBalances.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No assets found matching your search.' : 'No assets to display.'}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredAndSortedBalances.length} of {balances.length} assets
      </div>
    </div>
  );
}
