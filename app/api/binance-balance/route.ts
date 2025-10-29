import { NextRequest, NextResponse } from 'next/server'
import Binance from 'binance-api-node'
import { ApiResponse, PortfolioData, BalanceData } from '@/lib/types'

// Rate limiting map to track requests
const rateLimitMap = new Map<string, number[]>()

function rateLimit(identifier: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now()
  const windowStart = now - window
  
  const requests = rateLimitMap.get(identifier) || []
  const recentRequests = requests.filter(time => time > windowStart)
  
  if (recentRequests.length >= limit) {
    return false
  }
  
  recentRequests.push(now)
  rateLimitMap.set(identifier, recentRequests)
  return true
}

function validateEnvironment(): { isValid: boolean; error?: string } {
  if (!process.env.BINANCE_API_KEY) {
    console.error('Missing Binance API credentials: BINANCE_API_KEY')
    return { isValid: false, error: 'BINANCE_API_KEY is not configured' }
  }
  
  if (!process.env.BINANCE_API_SECRET) {
    console.error('Missing Binance API credentials: BINANCE_API_SECRET')
    return { isValid: false, error: 'BINANCE_API_SECRET is not configured' }
  }
  
  return { isValid: true }
}

async function createBinanceClient() {
  const validation = validateEnvironment()
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  return Binance({
    apiKey: process.env.BINANCE_API_KEY!,
    apiSecret: process.env.BINANCE_API_SECRET!,
  })
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      console.error(`Binance API error (attempt ${attempt + 1}):`, lastError.message)
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!rateLimit(clientIP, 100, 60000)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString()
        } satisfies ApiResponse<null>,
        { status: 429 }
      )
    }

    // Validate environment before creating client
    const validation = validateEnvironment()
    if (!validation.isValid) {
      console.error('Environment validation failed:', validation.error)
      return NextResponse.json(
        {
          success: false,
          error: 'API credentials not configured. Please check environment variables.',
          timestamp: new Date().toISOString()
        } satisfies ApiResponse<null>,
        { status: 500 }
      )
    }

    // Create Binance client
    const client = await createBinanceClient()
    
    console.log('Fetching Binance data...')
    
    // Fetch data with retry logic
    const [accountInfo, prices, futuresAccount] = await Promise.all([
      retryOperation(() => client.accountInfo(), 3, 1000),
      retryOperation(() => client.prices(), 3, 1000),
      retryOperation(() => (client as any).futuresAccountInfo(), 3, 1000).catch(error => {
        console.error('Error fetching futures account:', error.message);
        return { positions: [] };
      })
    ])

    console.log(`Received ${accountInfo.balances.length} balances and ${Object.keys(prices).length} prices`)

    // Process spot balance data
    const processBalances = (balances: { asset: string; free: string; locked: string }[], isFutures = false) => {
      return balances
        .map(balance => {
          const total = parseFloat(balance.free) + parseFloat(balance.locked)
          if (total <= 0) return null

          // For futures, we might need to handle the asset name differently
          const asset = isFutures && balance.asset.endsWith('_PERP') 
            ? balance.asset.replace('_PERP', '') 
            : balance.asset;

          // Try different price pairs
          const priceKeys = [
            `${asset}USDT`,
            `${asset}BUSD`,
            `${asset}USDC`,
            `${asset}USD`
          ]
          
          let priceUSDT = 0
          for (const key of priceKeys) {
            if (prices[key]) {
              priceUSDT = parseFloat(prices[key])
              break
            }
          }

        // Handle stablecoins as $1
        if (['USDT', 'BUSD', 'USDC', 'USD', 'TUSD', 'USDP'].includes(asset)) {
          priceUSDT = 1
        }

          const valueUSDT = total * priceUSDT
          
          return {
            asset,
            free: parseFloat(balance.free),
            locked: parseFloat(balance.locked),
            total,
            priceUSDT,
            valueUSDT,
            isFutures
          }
        })
        .filter((balance): balance is NonNullable<typeof balance> => {
          return balance !== null && balance.valueUSDT > 0.01;
        })
        .sort((a, b) => b.valueUSDT - a.valueUSDT)
    }

    // Process spot balances
    const processedBalances = processBalances(accountInfo.balances)
      .filter((balance): balance is NonNullable<typeof balance> => {
        return balance !== null && balance.valueUSDT > 0.01;
      })
      .sort((a, b) => b.valueUSDT - a.valueUSDT)

    console.log(`Processed ${processedBalances.length} non-zero balances`)

    // Process futures positions
    const futuresPositions = futuresAccount && 
      typeof futuresAccount === 'object' && 
      'positions' in futuresAccount && 
      Array.isArray(futuresAccount.positions)
        ? futuresAccount.positions 
        : [];

    const futuresBalances = futuresPositions
      .filter((p: any) => parseFloat(p.positionAmt) !== 0)
      .map((p: any) => ({
        asset: p.symbol.replace('USDT', '').replace('BUSD', '').replace('PERP', '').replace('_', ''),
        free: 0,
        locked: parseFloat(p.positionAmt),
        total: Math.abs(parseFloat(p.positionAmt)),
        priceUSDT: parseFloat(p.markPrice),
        valueUSDT: Math.abs(parseFloat(p.positionAmt) * parseFloat(p.markPrice)),
        isFutures: true,
        positionAmt: parseFloat(p.positionAmt),
        entryPrice: parseFloat(p.entryPrice),
        markPrice: parseFloat(p.markPrice),
        unRealizedProfit: parseFloat(p.unRealizedProfit)
      }))
      .filter((b: any) => b.valueUSDT > 0.01)
      .sort((a: any, b: any) => b.valueUSDT - a.valueUSDT)

    // Calculate total values
    const spotTotal = processedBalances.reduce((sum, b) => sum + b.valueUSDT, 0)
    const futuresTotal = futuresBalances.reduce((sum: number, b: any) => sum + b.valueUSDT, 0)
    const totalValue = spotTotal + futuresTotal

    // Combine all balances with allocations
    const allBalances = [
      ...processedBalances.map(balance => ({
        ...balance,
        allocation: totalValue > 0 ? (balance.valueUSDT / totalValue) * 100 : 0
      })),
      ...futuresBalances.map((balance: any) => ({
        ...balance,
        allocation: totalValue > 0 ? (balance.valueUSDT / totalValue) * 100 : 0
      }))
    ]

    // Simulated 24h change (in production, you'd fetch this from price history)
    const spotChange24h = Math.random() * 10 - 5
    const futuresChange24h = Math.random() * 10 - 5
    const totalChange24h = spotTotal > 0 || futuresTotal > 0 
      ? (spotTotal * spotChange24h + futuresTotal * futuresChange24h) / (spotTotal + futuresTotal)
      : 0

    const portfolioData: PortfolioData = {
      accounts: {
        spot: {
          type: 'spot',
          balances: allBalances.filter(b => !b.isFutures),
          totalValue: spotTotal,
          totalChange24h: spotChange24h,
          timestamp: new Date().toISOString()
        },
        margin: {
          type: 'margin',
          balances: [],
          totalValue: 0,
          totalChange24h: 0,
          timestamp: new Date().toISOString()
        },
        futures: {
          type: 'futures',
          balances: allBalances.filter(b => b.isFutures),
          totalValue: futuresTotal,
          totalChange24h: futuresChange24h,
          timestamp: new Date().toISOString()
        }
      },
      totalValue,
      totalChange24h,
      timestamp: new Date().toISOString(),
      performance: {
        daily: [],
        weekly: [],
        monthly: []
      }
    }

    const response: ApiResponse<PortfolioData> = {
      success: true,
      data: portfolioData,
      timestamp: new Date().toISOString(),
    }

    // Add response time header
    const responseTime = Date.now() - startTime
    console.log(`Request completed in ${responseTime}ms`)
    
    const nextResponse = NextResponse.json(response)
    nextResponse.headers.set('X-Response-Time', `${responseTime}ms`)
    nextResponse.headers.set('Cache-Control', 'no-store, must-revalidate')
    
    return nextResponse

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Binance API Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`
    })
    
    let errorMessage = 'Failed to fetch portfolio data'
    let statusCode = 500
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('invalid api-key') || message.includes('unauthorized')) {
        errorMessage = 'Invalid API credentials. Please check your Binance API key.'
        statusCode = 401
      } else if (message.includes('timestamp') || message.includes('recvwindow')) {
        errorMessage = 'Server time synchronization error. Please try again.'
        statusCode = 400
      } else if (message.includes('configured') || message.includes('not found')) {
        errorMessage = 'API configuration error. Environment variables may be missing.'
        statusCode = 500
      } else if (message.includes('enotfound') || message.includes('network') || message.includes('timeout')) {
        errorMessage = 'Network connection error. Please check your internet connection.'
        statusCode = 503
      } else if (message.includes('rate limit') || message.includes('too many requests')) {
        errorMessage = 'Binance API rate limit exceeded. Please wait before retrying.'
        statusCode = 429
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }

    const nextResponse = NextResponse.json(errorResponse, { status: statusCode })
    nextResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    
    return nextResponse
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const validation = validateEnvironment()
  
  if (!validation.isValid) {
    return new NextResponse(null, { 
      status: 503,
      headers: { 'X-Health-Status': 'unhealthy', 'X-Error': validation.error || 'Unknown error' }
    })
  }
  
  return new NextResponse(null, { 
    status: 200,
    headers: { 'X-Health-Status': 'healthy' }
  })
}