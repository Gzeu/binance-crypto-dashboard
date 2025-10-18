import { NextRequest, NextResponse } from 'next/server';
import Binance from 'binance-api-node';
import { ApiResponse, PortfolioData, BalanceData } from '@/lib/types';

// Rate limiting map to track requests
const rateLimitMap = new Map<string, number[]>();

function rateLimit(identifier: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - window;
  
  const requests = rateLimitMap.get(identifier) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

function validateEnvironment(): { isValid: boolean; error?: string } {
  if (!process.env.BINANCE_API_KEY) {
    return { isValid: false, error: 'BINANCE_API_KEY is not configured' };
  }
  
  if (!process.env.BINANCE_API_SECRET) {
    return { isValid: false, error: 'BINANCE_API_SECRET is not configured' };
  }
  
  return { isValid: true };
}

async function createBinanceClient() {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return Binance({
    apiKey: process.env.BINANCE_API_KEY!,
    apiSecret: process.env.BINANCE_API_SECRET!,
    useServerTime: true,
  });
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientIP, 100, 60000)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString()
        } satisfies ApiResponse<null>,
        { status: 429 }
      );
    }

    // Create Binance client
    const client = await createBinanceClient();
    
    // Fetch data with retry logic
    const [accountInfo, prices] = await Promise.all([
      retryOperation(() => client.accountInfo()),
      retryOperation(() => client.prices())
    ]);

    // Process balance data
    const processedBalances: BalanceData[] = accountInfo.balances
      .map(balance => {
        const total = parseFloat(balance.free) + parseFloat(balance.locked);
        if (total <= 0) return null;

        // Try different price pairs
        const priceKeys = [
          `${balance.asset}USDT`,
          `${balance.asset}BUSD`,
          `${balance.asset}USDC`
        ];
        
        let priceUSDT = 0;
        for (const key of priceKeys) {
          if (prices[key]) {
            priceUSDT = parseFloat(prices[key]);
            break;
          }
        }

        // Handle USDT, BUSD, USDC as $1
        if (['USDT', 'BUSD', 'USDC', 'USD'].includes(balance.asset)) {
          priceUSDT = 1;
        }

        const valueUSDT = total * priceUSDT;
        
        return {
          asset: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          total,
          priceUSDT,
          valueUSDT,
        };
      })
      .filter((balance): balance is BalanceData => 
        balance !== null && balance.valueUSDT > 0.01
      )
      .sort((a, b) => b.valueUSDT - a.valueUSDT);

    // Calculate total portfolio value
    const totalValue = processedBalances.reduce((sum, balance) => sum + balance.valueUSDT, 0);
    
    // Add allocation percentages
    const balancesWithAllocation = processedBalances.map(balance => ({
      ...balance,
      allocation: totalValue > 0 ? (balance.valueUSDT / totalValue) * 100 : 0
    }));

    // Simulated 24h change (in production, you'd fetch this from price history)
    const totalChange24h = Math.random() * 10 - 5;

    const portfolioData: PortfolioData = {
      balances: balancesWithAllocation,
      totalValue,
      totalChange24h,
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse<PortfolioData> = {
      success: true,
      data: portfolioData,
      timestamp: new Date().toISOString(),
    };

    // Add response time header
    const responseTime = Date.now() - startTime;
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('X-Response-Time', `${responseTime}ms`);
    
    return nextResponse;

  } catch (error) {
    console.error('Binance API Error:', error);
    
    let errorMessage = 'Failed to fetch portfolio data';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid API-key')) {
        errorMessage = 'Invalid API credentials';
        statusCode = 401;
      } else if (error.message.includes('Timestamp')) {
        errorMessage = 'Server time synchronization error';
        statusCode = 400;
      } else if (error.message.includes('configured')) {
        errorMessage = 'API configuration error';
        statusCode = 500;
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        errorMessage = 'Network connection error';
        statusCode = 503;
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    return new NextResponse(null, { 
      status: 503,
      headers: { 'X-Health-Status': 'unhealthy' }
    });
  }
  
  return new NextResponse(null, { 
    status: 200,
    headers: { 'X-Health-Status': 'healthy' }
  });
}