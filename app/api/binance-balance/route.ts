import { NextResponse } from 'next/server';
import Binance from 'binance-api-node';
import { z } from 'zod';
import type { AccountBalance, AssetBalance, OpenPosition, OpenOrder } from '@/lib/types';
import crypto from 'crypto';

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

// Helper function for signed API calls
function makeSignedRequest(apiKey: string, apiSecret: string, endpoint: string): Promise<any> {
  const baseURL = 'https://fapi.binance.com';
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');

  const url = `${baseURL}${endpoint}?${queryString}&signature=${signature}`;

  return fetch(url, {
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  }).then(res => res.json());
}

async function processBalances(balances: any[], prices: any, changeMap: Map<string, string>): Promise<AssetBalance[]> {
  return balances
    .filter((balance: any) => {
      // Handle both spot and futures account structures
      const total = parseFloat(balance.free) + parseFloat(balance.locked) || parseFloat(balance.walletBalance) || 0;
      return total > 0.00001;
    })
    .map((balance: any) => {
      const asset = balance.asset;
      
      // Handle both spot and futures structures
      const free = parseFloat(balance.free) || 0;
      const locked = parseFloat(balance.locked) || 0;
      const walletBalance = parseFloat(balance.walletBalance) || 0;
      const total = free + locked || walletBalance;

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
        free: (free || total).toFixed(8),
        locked: locked.toFixed(8),
        total: total.toFixed(8),
        priceUSDT: priceUSDT.toFixed(6),
        valueUSDT: valueUSDT.toFixed(2),
        change24h,
      };
    })
    .sort((a: any, b: any) => parseFloat(b.valueUSDT) - parseFloat(a.valueUSDT));
}

async function getSpotAccountData(client: any, prices: any, changeMap: Map<string, string>): Promise<AccountBalance> {
  const accountInfo = await retryApiCall(() => client.accountInfo());
  const balances = await processBalances(accountInfo.balances, prices, changeMap);
  
  const totalBalanceUSDT = balances.reduce(
    (sum: number, balance: AssetBalance) => sum + parseFloat(balance.valueUSDT),
    0
  );

  return {
    accountType: 'spot',
    totalBalanceUSDT: totalBalanceUSDT.toFixed(2),
    availableBalanceUSDT: totalBalanceUSDT.toFixed(2), // Simplified - would need to calculate actual available
    balances,
  };
}

async function getFuturesAccountData(client: any, prices: any, changeMap: Map<string, string>, apiKey: string, apiSecret: string): Promise<AccountBalance | null> {
  try {
    // Use direct API call for futures account info
    const accountInfo = await retryApiCall(() => makeSignedRequest(apiKey, apiSecret, '/fapi/v2/account'));
    
    if (!accountInfo || !accountInfo.assets) {
      console.warn('Invalid futures account data structure');
      return null;
    }
    
    const balances = await processBalances(accountInfo.assets, prices, changeMap);
    
    const totalBalanceUSDT = balances.reduce(
      (sum: number, balance: AssetBalance) => sum + parseFloat(balance.valueUSDT),
      0
    );

    return {
      accountType: 'futures',
      totalBalanceUSDT: totalBalanceUSDT.toFixed(2),
      availableBalanceUSDT: parseFloat(accountInfo.availableBalance || '0').toFixed(2),
      balances,
      marginLevel: accountInfo.marginLevel || '0',
      marginFree: parseFloat(accountInfo.marginFree || '0').toFixed(2),
      marginUsed: parseFloat(accountInfo.marginUsed || '0').toFixed(2),
      maintenanceMargin: parseFloat(accountInfo.maintenanceMargin || '0').toFixed(2),
    };
  } catch (error: any) {
    console.warn('Futures account not available:', error.message);
    return null;
  }
}

async function getOpenPositions(apiKey: string, apiSecret: string): Promise<OpenPosition[]> {
  try {
    // Use direct API call for futures positions
    const positions = await retryApiCall(() => makeSignedRequest(apiKey, apiSecret, '/fapi/v2/positionRisk'));
    
    if (!Array.isArray(positions)) {
      console.warn('Invalid positions data structure');
      return [];
    }
    
    return positions
      .filter((pos: any) => parseFloat(pos.positionAmt) !== 0)
      .map((pos: any) => ({
        symbol: pos.symbol,
        positionAmt: pos.positionAmt,
        entryPrice: pos.entryPrice,
        markPrice: pos.markPrice,
        unRealizedProfit: pos.unRealizedProfit,
        liquidationPrice: pos.liquidationPrice,
        leverage: pos.leverage,
        maxNotionalValue: pos.maxNotionalValue,
        marginType: pos.marginType,
        isolatedMargin: pos.isolatedMargin,
        isAutoAddMargin: pos.isAutoAddMargin,
        positionSide: pos.positionSide,
        notional: pos.notional,
        isolatedWallet: pos.isolatedWallet,
        updateTime: pos.updateTime,
      }));
  } catch (error: any) {
    console.warn('Failed to fetch open positions:', error.message);
    return [];
  }
}

async function getOpenOrders(client: any, apiKey: string, apiSecret: string): Promise<OpenOrder[]> {
  try {
    const [spotOrders, futuresOrders] = await Promise.allSettled([
      retryApiCall(() => client.openOrders({})),
      retryApiCall(() => makeSignedRequest(apiKey, apiSecret, '/fapi/v2/openOrders'))
    ]);

    const orders: OpenOrder[] = [];
    
    if (spotOrders.status === 'fulfilled' && Array.isArray(spotOrders.value)) {
      orders.push(...spotOrders.value.map((order: any) => ({
        ...order,
        symbol: order.symbol,
        orderId: order.orderId,
        price: order.price,
        origQty: order.origQty,
        executedQty: order.executedQty,
        side: order.side,
        type: order.type,
        status: order.status,
        time: order.time,
        updateTime: order.updateTime,
        isWorking: order.isWorking,
      })));
    }
    
    if (futuresOrders.status === 'fulfilled' && Array.isArray(futuresOrders.value)) {
      orders.push(...futuresOrders.value.map((order: any) => ({
        ...order,
        symbol: order.symbol,
        orderId: order.orderId,
        price: order.price,
        origQty: order.origQty,
        executedQty: order.executedQty,
        side: order.side,
        type: order.type,
        status: order.status,
        time: order.time,
        updateTime: order.updateTime,
        isWorking: order.isWorking,
      })));
    }

    return orders;
  } catch (error: any) {
    console.warn('Failed to fetch open orders:', error.message);
    return [];
  }
}

async function getMarginAccountData(client: any, prices: any, changeMap: Map<string, string>): Promise<AccountBalance | null> {
  try {
    const marginAccountInfo = await retryApiCall(() => client.marginAccountInfo());
    const balances = await processBalances(marginAccountInfo.userAssets, prices, changeMap);
    
    const totalBalanceUSDT = balances.reduce(
      (sum: number, balance: AssetBalance) => sum + parseFloat(balance.valueUSDT),
      0
    );

    return {
      accountType: 'margin',
      totalBalanceUSDT: totalBalanceUSDT.toFixed(2),
      availableBalanceUSDT: parseFloat(marginAccountInfo.assetOfUSDT?.free || 0).toFixed(2),
      balances,
      marginLevel: marginAccountInfo.marginLevel || '0',
      marginFree: parseFloat(marginAccountInfo.marginFree || 0).toFixed(2),
      marginUsed: parseFloat(marginAccountInfo.marginUsed || 0).toFixed(2),
    };
  } catch (error: any) {
    console.warn('Margin account not available:', error.message);
    return null;
  }
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

    const [dailyStats, prices] = await Promise.all([
      retryApiCall(() => client.dailyStats()),
      retryApiCall(() => client.prices()),
    ]);

    const changeMap = new Map<string, string>();
    if (Array.isArray(dailyStats)) {
      dailyStats.forEach((stat: any) => {
        changeMap.set(stat.symbol, stat.priceChangePercent);
      });
    }

    const [spotAccount, futuresAccount, marginAccount, openPositions, openOrders] = await Promise.allSettled([
      getSpotAccountData(client, prices, changeMap),
      getFuturesAccountData(client, prices, changeMap, env.BINANCE_API_KEY, env.BINANCE_API_SECRET),
      getMarginAccountData(client, prices, changeMap),
      getOpenPositions(env.BINANCE_API_KEY, env.BINANCE_API_SECRET),
      getOpenOrders(client, env.BINANCE_API_KEY, env.BINANCE_API_SECRET)
    ]);

    const accounts: AccountBalance[] = [];
    let totalPortfolioUSDT = 0;
    
    if (spotAccount.status === 'fulfilled') {
      accounts.push(spotAccount.value);
      totalPortfolioUSDT += parseFloat(spotAccount.value.totalBalanceUSDT);
    }
    
    if (futuresAccount.status === 'fulfilled' && futuresAccount.value) {
      accounts.push(futuresAccount.value);
      totalPortfolioUSDT += parseFloat(futuresAccount.value.totalBalanceUSDT);
    }
    
    if (marginAccount.status === 'fulfilled' && marginAccount.value) {
      accounts.push(marginAccount.value);
      totalPortfolioUSDT += parseFloat(marginAccount.value.totalBalanceUSDT);
    }

    const totalSpotUSDT = accounts.find(acc => acc.accountType === 'spot')?.totalBalanceUSDT || '0';
    const totalFuturesUSDT = accounts.find(acc => acc.accountType === 'futures')?.totalBalanceUSDT || '0';
    const totalMarginUSDT = accounts.find(acc => acc.accountType === 'margin')?.totalBalanceUSDT || '0';

    const positions = openPositions.status === 'fulfilled' ? openPositions.value : [];
    const orders = openOrders.status === 'fulfilled' ? openOrders.value : [];
    
    const totalUnrealizedPnL = positions.reduce(
      (sum: number, pos: OpenPosition) => sum + parseFloat(pos.unRealizedProfit),
      0
    );

    const responseData = {
      accounts,
      totalPortfolioUSDT: totalPortfolioUSDT.toFixed(2),
      totalSpotUSDT,
      totalFuturesUSDT,
      totalMarginUSDT,
      openPositions: positions,
      openOrders: orders,
      realTimePrices: prices,
      totalUnrealizedPnL: totalUnrealizedPnL.toFixed(2),
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      updateTime: new Date().toISOString(),
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
