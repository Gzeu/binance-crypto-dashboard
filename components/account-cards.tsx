'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AccountBalance } from '@/lib/types'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface AccountCardsProps {
  accounts: AccountBalance[]
  totalPortfolioUSDT: string
}

export function AccountCards({ accounts, totalPortfolioUSDT }: AccountCardsProps) {
  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'spot':
        return 'bg-blue-500'
      case 'futures':
        return 'bg-green-500'
      case 'margin':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'spot':
        return 'Spot'
      case 'futures':
        return 'Futures'
      case 'margin':
        return 'Margin'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Card */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Total Portfolio
          </CardTitle>
          <CardDescription>Combined value across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${parseFloat(totalPortfolioUSDT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Account Type Cards */}
      {accounts.map((account) => (
        <Card key={account.accountType} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className={`${getAccountTypeColor(account.accountType)} text-white`}>
                {getAccountTypeLabel(account.accountType)}
              </Badge>
              {account.marginLevel && (
                <div className="text-sm text-muted-foreground">
                  M: {parseFloat(account.marginLevel).toFixed(2)}
                </div>
              )}
            </div>
            <CardTitle className="text-lg">
              ${parseFloat(account.totalBalanceUSDT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
            <CardDescription>
              Available: ${parseFloat(account.availableBalanceUSDT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Assets:</span>
                <span className="font-medium">{account.balances.length}</span>
              </div>
              
              {account.marginUsed && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Margin Used:</span>
                    <span className="font-medium">${parseFloat(account.marginUsed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Margin Free:</span>
                    <span className="font-medium">${parseFloat(account.marginFree || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}

              {account.maintenanceMargin && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Maintenance:</span>
                  <span className="font-medium">${parseFloat(account.maintenanceMargin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
