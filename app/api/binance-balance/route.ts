import { NextResponse } from 'next/server';
import Binance from 'binance-api-node';
import { z } from 'zod';

const envSchema = z.object({
  BINANCE_API_KEY: z.string().min(1, 'BINANCE_API_KEY is required'),
  BINANCE_API_SECRET: z.string().min(1, 'BINANCE_API_SECRET is required'),
});

let lastFetchTime = 0;
let cachedData: any = null;
const CACHE_DURATION = 15000;

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryApiCall(fn: () => Promise<any>, attempts: number = RETRY_ATTEMPTS): Promise<any> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === attempts - 1;
      const shouldRetry = error?.code === -1003 || error?.code === 429 || error?.code >= 500;

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      const delayMs = RETRY_DELAY * Math.pow(2, i) + Math.random() * 1000;
      await delay(delayMs);
    }
  }

  throw new Error('Max retry attempts reached');
}

export async function GET() {
  try {
    const env = envSchema.parse({
      BINANCE_API_KEY: process.env.BINANCE_API_KEY,
      BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
    });

    const now = Date.now();
    if (cachedData && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: now - lastFetchTime,
      });
    }

    const client = Binance({
      apiKey: env.BINANCE_API_KEY,
      apiSecret: env.BINANCE_API_SECRET,
    });

    const [accountInfo, dailyStats] = await Promise.all([
      retryApiCall(() => client.accountInfo()),
      retryApiCall(() => client.dailyStats()),
    ]);

    const prices = await retryApiCall(() => client.prices());

    const changeMap = new Map<string, string>();
    if (Array.isArray(dailyStats)) {
      dailyStats.forEach((stat: any) => {
        changeMap.set(stat.symbol, stat.priceChangePercent);
      });
    }

    const balances = accountInfo.balances
      .filter((balance: any) => {
        const total = parseFloat(balance.free) + parseFloat(balance.locked);
        return total > 0.00001;
      })
      .map((balance: any) => {
        const asset = balance.asset;
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;

        let priceUSDT = 0;
        let change24h = '0.00';

        if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC' || asset === 'FDUSD') {
          priceUSDT = 1;
        } else {
          const priceKey = `${asset}USDT`;
          const btcPriceKey = `${asset}BTC`;

          if (prices[priceKey]) {
            priceUSDT = parseFloat(prices[priceKey]);
            change24h = changeMap.get(priceKey) || '0.00';
          } else if (prices[btcPriceKey] && prices.BTCUSDT) {
            const btcPrice = parseFloat(prices.BTCUSDT);
            const assetBtcPrice = parseFloat(prices[btcPriceKey]);
            priceUSDT = assetBtcPrice * btcPrice;
            change24h = changeMap.get(btcPriceKey) || '0.00';
          }
        }

        const valueUSDT = total * priceUSDT;

        return {
          asset,
          free: free.toFixed(8),
          locked: locked.toFixed(8),
          total: total.toFixed(8),
          priceUSDT: priceUSDT.toFixed(6),
          valueUSDT: valueUSDT.toFixed(2),
          change24h,
        };
      })
      .sort((a: any, b: any) => parseFloat(b.valueUSDT) - parseFloat(a.valueUSDT));

    const totalPortfolioUSDT = balances.reduce(
      (sum: number, balance: any) => sum + parseFloat(balance.valueUSDT),
      0
    );

    const responseData = {
      balances,
      totalPortfolioUSDT: totalPortfolioUSDT.toFixed(2),
      accountType: accountInfo.accountType,
      canTrade: accountInfo.canTrade,
      canWithdraw: accountInfo.canWithdraw,
      canDeposit: accountInfo.canDeposit,
      updateTime: new Date(accountInfo.updateTime).toISOString(),
      serverTime: new Date().toISOString(),
      cached: false,
    };

    cachedData = responseData;
    lastFetchTime = now;

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Binance API Error:', {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    const errorMessage = error.code === -2014
      ? 'Invalid API key format'
      : error.code === -1022
      ? 'Invalid signature'
      : error.code === -1003
      ? 'Rate limit exceeded. Please try again later.'
      : error.code === 429
      ? 'Too many requests. Please try again later.'
      : 'Unable to fetch portfolio data';

    return NextResponse.json(
      {
        error: errorMessage,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: error.code === -1003 || error.code === 429 ? 429 : 500 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
