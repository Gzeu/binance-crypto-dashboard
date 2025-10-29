import { NextResponse } from 'next/server';
import Binance from 'binance-api-node';
import { z } from 'zod';

// Validation schema for environment variables
const envSchema = z.object({
  BINANCE_API_KEY: z.string().min(1, 'BINANCE_API_KEY is required'),
  BINANCE_API_SECRET: z.string().min(1, 'BINANCE_API_SECRET is required'),
});

// Cache pentru rate limiting
let lastFetchTime = 0;
let cachedData: any = null;
const CACHE_DURATION = 15000; // 15 seconds cache

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Helper function for exponential backoff
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to retry API calls
async function retryApiCall<T>(fn: () => Promise<T>, attempts: number = RETRY_ATTEMPTS): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === attempts - 1;
      const shouldRetry = error?.code === -1003 || error?.code === 429 || error?.code >= 500;
      
      if (isLastAttempt || !shouldRetry) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delayMs = RETRY_DELAY * Math.pow(2, i) + Math.random() * 1000;
      await delay(delayMs);
    }
  }
  
  throw new Error('Max retry attempts reached');
}

// GET handler for portfolio balance
export async function GET() {
  try {
    // Validate environment variables
    const env = envSchema.parse({
      BINANCE_API_KEY: process.env.BINANCE_API_KEY,
      BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
    });

    // Check cache first to respect rate limits
    const now = Date.now();
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: now - lastFetchTime,
      });
    }

    // Initialize Binance client with server time synchronization
    const client = Binance({
      apiKey: env.BINANCE_API_KEY,
      apiSecret: env.BINANCE_API_SECRET,
      useServerTime: true,
      recvWindow: 60000, // 60 seconds receive window
    });

    // Fetch account information with retry logic
    const [accountInfo, exchangeInfo] = await Promise.all([
      retryApiCall(() => client.accountInfo()),
      retryApiCall(() => client.exchangeInfo()),
    ]);

    // Get current prices for USDT conversion
    const prices = await retryApiCall(() => client.prices());

    // Process balances - filter out zero balances and format
    const balances = accountInfo.balances
      .filter((balance: any) => {
        const total = parseFloat(balance.free) + parseFloat(balance.locked);
        return total > 0.00001; // Filter out dust amounts
      })
      .map((balance: any) => {
        const asset = balance.asset;
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;
        
        // Get USDT price
        let priceUSDT = 0;
        if (asset === 'USDT') {
          priceUSDT = 1;
        } else if (asset === 'BUSD') {
          priceUSDT = 1; // Assuming BUSD ≈ 1 USDT
        } else {
          // Try different price pairs
          const priceKey = `${asset}USDT`;
          const btcPriceKey = `${asset}BTC`;
          
          if (prices[priceKey]) {
            priceUSDT = parseFloat(prices[priceKey]);
          } else if (prices[btcPriceKey] && prices['BTCUSDT']) {
            const btcPrice = parseFloat(prices['BTCUSDT']);
            const assetBtcPrice = parseFloat(prices[btcPriceKey]);
            priceUSDT = assetBtcPrice * btcPrice;
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
        };
      })
      .sort((a: any, b: any) => parseFloat(b.valueUSDT) - parseFloat(a.valueUSDT));

    // Calculate total portfolio value
    const totalPortfolioUSDT = balances.reduce(
      (sum: number, balance: any) => sum + parseFloat(balance.valueUSDT),
      0
    );

    // Prepare response data
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

    // Update cache
    cachedData = responseData;
    lastFetchTime = now;

    return NextResponse.json(responseData);
  
  } catch (error: any) {
    console.error('Binance API Error:', {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    // Return sanitized error response
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

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
