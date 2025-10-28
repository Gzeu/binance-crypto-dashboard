# 🚀 Binance Crypto Dashboard

**Production-ready Binance cryptocurrency portfolio dashboard built with Next.js 14, TypeScript, and Vercel deployment**

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## ✨ Features

### 📊 **Portfolio Management**
- **Real-time Portfolio Overview** - Total value, 24h changes, asset allocation
- **Interactive Asset Table** - Sortable columns with search and filter functionality
- **Visual Allocation Charts** - Pie charts and distribution analysis
- **CSV Export** - Download portfolio data for external analysis

### 🔒 **Security & Performance**
- **Server-side API Integration** - Binance API keys never exposed to client
- **Rate Limiting** - Built-in protection against API abuse
- **Error Handling** - Robust retry logic with exponential backoff
- **TypeScript** - Full type safety across the entire application

### 🎨 **User Experience**
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark/Light Theme** - Persistent theme toggle with smooth transitions
- **Real-time Updates** - Auto-refresh every 30 seconds + manual refresh
- **Professional UI** - Clean, modern interface inspired by trading platforms

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **Data** | SWR, Binance API Node |
| **Deployment** | Vercel (Serverless) |
| **Security** | Server-side API routes, Environment variables |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Binance API credentials (API Key + Secret)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Gzeu/binance-crypto-dashboard.git
cd binance-crypto-dashboard

# Install dependencies
npm ci
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Binance API credentials
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Security Note:** API credentials are used ONLY on the server side. Never expose them in client-side code.

### 3. Run Development Server

```bash
npm run dev
```

🎉 **Dashboard will be available at [http://localhost:3000](http://localhost:3000)**

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gzeu/binance-crypto-dashboard)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Environment Variables on Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add the following variables:

```
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📁 Project Structure

```
binance-crypto-dashboard/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (server-side)
│   │   └── binance-balance/
│   │       └── route.ts   # Binance API integration
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── asset-table.tsx   # Interactive portfolio table
│   ├── allocation-chart.tsx # Portfolio allocation visualization
│   ├── navbar.tsx        # Navigation with theme toggle
│   ├── portfolio-summary.tsx # Portfolio overview cards
│   └── theme-provider.tsx # Dark/light theme provider
├── lib/                  # Utilities and types
│   ├── types.ts          # TypeScript definitions
│   ├── utils.ts          # Helper functions
│   └── cn.ts            # Tailwind class merging
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Project dependencies
```

## 🔧 API Documentation

### GET `/api/binance-balance`

Returns complete portfolio data from Binance.

**Response:**
```json
{
  "totalValue": 5000.25,
  "change24h": 2.5,
  "balances": [
    {
      "asset": "BTC",
      "total": 0.15,
      "priceUSDT": 45000.00,
      "valueUSDT": 6750.00
    }
  ]
}
```

**Features:**
- Rate limiting protection
- Error handling with retry logic
- Real-time price data from Binance
- Server-side only execution

## 🔐 Security Best Practices

### ✅ Implemented Security Measures

- **Server-side API Integration** - API keys never reach the browser
- **Environment Variable Encryption** - Credentials stored securely in Vercel
- **HTTPS Enforcement** - SSL/TLS encryption for all communications
- **Rate Limiting** - Protection against API abuse
- **CORS Protection** - Secure cross-origin resource sharing
- **Input Validation** - Sanitized API inputs and outputs

### 🛡️ Security Checklist

- [ ] API credentials configured in environment variables only
- [ ] `.env.local` added to `.gitignore`
- [ ] Vercel environment variables are encrypted
- [ ] API permissions set to "Read Only" on Binance
- [ ] Production deployment uses HTTPS

## ⚡ Performance Optimizations

- **Serverless Architecture** - Auto-scaling with zero cold starts
- **Edge Caching** - Global CDN distribution via Vercel
- **Code Splitting** - Lazy loading for optimal bundle sizes
- **Image Optimization** - Next.js automatic image optimization
- **SWR Caching** - Intelligent client-side data caching

## 📊 Monitoring & Analytics

### Built-in Monitoring

- **Vercel Analytics** - Real-time performance metrics
- **Error Tracking** - Automatic error logging and retry
- **API Health Checks** - Monitor Binance API connectivity
- **Performance Metrics** - Track load times and user interactions

### Custom Monitoring Setup

```bash
# Enable Vercel Analytics
npm install @vercel/analytics

# Add to layout.tsx
import { Analytics } from '@vercel/analytics/react'
```

## 🛟 Troubleshooting

### Common Issues

**API Connection Failed**
- ✅ Verify Binance API credentials
- ✅ Check API key permissions (needs "Read" access)
- ✅ Ensure IP whitelist includes Vercel IPs

**Build Errors**
- ✅ Run `npm run type-check` for TypeScript errors
- ✅ Ensure all environment variables are set
- ✅ Check Node.js version compatibility (>=18.0.0)

**Deployment Issues**
- ✅ Verify Vercel environment variables
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure serverless function timeout limits

### Debug Mode

```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write tests for new components
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo:** [https://binance-crypto-dashboard.vercel.app](https://binance-crypto-dashboard.vercel.app)
- **Documentation:** [Binance API Docs](https://binance-docs.github.io/apidocs/spot/en/)
- **Next.js 14:** [Next.js Documentation](https://nextjs.org/docs)
- **Vercel:** [Deployment Documentation](https://vercel.com/docs)

## ⭐ Star History

If this project helped you, please consider giving it a ⭐!

---

**Built with ❤️ by [George Pricop](https://github.com/Gzeu)**

*Ready for production • Secure by default • Scalable architecture*