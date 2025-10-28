import { NextRequest, NextResponse } from 'next/server'
import Binance from 'binance-api-node'

type Trade = {
  symbol: string
  id: number
  orderId: number
  price: string
  qty: string
  quoteQty: string
  commission: string
  commissionAsset: string
  time: number
  isBuyer: boolean
}

type PnlBreakdown = {
  symbol: string
  realizedPnlUSD: number
  feesUSD: number
  trades: number
}

type PnlResponse = {
  period: { from: string; to: string }
  realizedPnlUSD: number
  unrealizedPnlUSD: number
  roiPct: number
  feesUSD: number
  breakdown: PnlBreakdown[]
}

function validateEnv() {
  if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET) {
    throw new Error('BINANCE API keys missing')
  }
}

function parseDateParam(value: string | null, fallbackDays = 30) {
  if (!value) return new Date(Date.now() - fallbackDays * 24 * 60 * 60 * 1000)
  const d = new Date(value)
  if (isNaN(d.getTime())) return new Date(Date.now() - fallbackDays * 24 * 60 * 60 * 1000)
  return d
}

async function getSpotPricesUSD(client: ReturnType<typeof Binance>) {
  const prices = await client.prices()
  return (asset: string) => {
    if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC' || asset === 'USD') return 1
    const keys = [`${asset}USDT`, `${asset}BUSD`, `${asset}USDC`]
    for (const k of keys) if (prices[k]) return parseFloat(prices[k])
    return 0
  }
}

// Average Cost method for realized PnL (spot)
function computeRealizedPnlAverageCost(trades: Trade[], getPriceUSD: (asset: string) => number) {
  // Group by symbol
  const bySymbol = new Map<string, Trade[]>()
  for (const t of trades) {
    const arr = bySymbol.get(t.symbol) || []
    arr.push(t)
    bySymbol.set(t.symbol, arr)
  }

  let totalRealized = 0
  let totalFees = 0
  const breakdown: PnlBreakdown[] = []

  for (const [symbol, list] of bySymbol.entries()) {
    // Sort by time asc
    list.sort((a, b) => a.time - b.time)

    // Track position using average cost in base asset
    // For symbol like BTCUSDT: base=BTC, quote=USDT
    const base = symbol.replace(/USDT|BUSD|USDC|USD$/, '')

    let positionQty = 0
    let avgCostUSDPerBase = 0
    let realized = 0
    let fees = 0

    for (const tr of list) {
      const qty = parseFloat(tr.qty)
      const price = parseFloat(tr.price)
      const quote = parseFloat(tr.quoteQty)

      // Fee conversion to USD
      const feeAsset = tr.commissionAsset
      const feeAmt = parseFloat(tr.commission)
      const feeUsd = getPriceUSD(feeAsset) * feeAmt
      fees += feeUsd

      if (tr.isBuyer) {
        // Buy increases position; update average cost
        const costUSD = quote // spent in quote (approx USD stable)
        const newQty = positionQty + qty
        avgCostUSDPerBase = newQty > 0 ? (avgCostUSDPerBase * positionQty + costUSD) / newQty : 0
        positionQty = newQty
      } else {
        // Sell decreases position; realize PnL on sold qty
        const qtySold = Math.min(qty, positionQty)
        const proceedsUSD = price * qtySold
        const costUSD = avgCostUSDPerBase * qtySold
        realized += proceedsUSD - costUSD
        positionQty -= qtySold
      }
    }

    totalRealized += realized
    totalFees += fees
    breakdown.push({ symbol, realizedPnlUSD: realized, feesUSD: fees, trades: list.length })
  }

  return { totalRealized, totalFees, breakdown }
}

export async function GET(req: NextRequest) {
  try {
    validateEnv()
    const client = Binance({
      apiKey: process.env.BINANCE_API_KEY!,
      apiSecret: process.env.BINANCE_API_SECRET!,
    })

    const { searchParams } = new URL(req.url)
    const from = parseDateParam(searchParams.get('from'))
    const to = parseDateParam(searchParams.get('to'), 0)

    // Fetch recent trades for all symbols in portfolio scope
    const account = await client.accountInfo()
    const symbols = account.balances
      .map(b => b.asset)
      .filter(a => a && a !== 'USD')
      .map(a => `${a}USDT`)

    const getUSD = await getSpotPricesUSD(client)

    const trades: Trade[] = []
    for (const symbol of symbols) {
      try {
        // Limit window to avoid rate limits; Binance returns latest trades
        const symbolTrades = await client.myTrades({ symbol })
        for (const t of symbolTrades) {
          if (t.time >= from.getTime() && t.time <= to.getTime()) trades.push(t as unknown as Trade)
        }
      } catch (_) {
        // ignore symbols without trade permission/history
      }
    }

    const { totalRealized, totalFees, breakdown } = computeRealizedPnlAverageCost(trades, getUSD)

    // Unrealized PnL approximation: need avg cost of current open position; here return 0 as placeholder
    const unrealized = 0

    // ROI estimation: realized PnL / (sum buys in window) — simplified; precise ROI requires full cashflow
    const notionalBuysUSD = trades.filter(t => t.isBuyer).reduce((s, t) => s + parseFloat(t.quoteQty), 0)
    const roi = notionalBuysUSD > 0 ? (totalRealized / notionalBuysUSD) * 100 : 0

    const res: PnlResponse = {
      period: { from: from.toISOString(), to: to.toISOString() },
      realizedPnlUSD: Number(totalRealized.toFixed(2)),
      unrealizedPnlUSD: Number(unrealized.toFixed(2)),
      roiPct: Number(roi.toFixed(2)),
      feesUSD: Number(totalFees.toFixed(2)),
      breakdown: breakdown
        .sort((a, b) => b.realizedPnlUSD - a.realizedPnlUSD)
        .map(b => ({ ...b, realizedPnlUSD: Number(b.realizedPnlUSD.toFixed(2)), feesUSD: Number(b.feesUSD.toFixed(2)) })),
    }

    return NextResponse.json({ success: true, data: res, timestamp: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, timestamp: new Date().toISOString() }, { status: 500 })
  }
}
