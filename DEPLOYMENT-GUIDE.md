# 🚀 Deployment Guide - Binance Crypto Dashboard

Complete step-by-step guide to deploy your Binance crypto dashboard to production on Vercel.

## 🎯 Prerequisites Checklist

- [ ] GitHub account with repository access
- [ ] Vercel account (free tier available)
- [ ] Binance account with API credentials
- [ ] Node.js >= 18.0.0 locally (for testing)

## 📋 Step 1: Binance API Setup

### Create API Key

1. **Login to Binance** → Go to [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. **Create API Key**
   - Enter label: "Portfolio Dashboard"
   - Complete security verification (SMS/Email)
3. **Configure Permissions**
   - ✅ Enable "Enable Reading" (REQUIRED)
   - ❌ Leave "Enable Futures" disabled
   - ❌ Leave "Enable Margin" disabled
   - ❌ Leave "Permit Universal Transfer" disabled

### Security Settings

4. **IP Restrictions** (Recommended)
   - Add Vercel IP ranges (optional but recommended for production)
   - For development: Add your current IP

5. **Save Credentials Securely**
   ```
   API Key: [64-character string]
   Secret Key: [64-character string]
   ```
   ⚠️ **Never share these credentials or commit them to version control!**

## 🔄 Step 2: Local Development Setup

### Clone & Configure

```bash
# Clone your repository
git clone https://github.com/Gzeu/binance-crypto-dashboard.git
cd binance-crypto-dashboard

# Install dependencies
npm ci

# Setup environment variables
cp .env.example .env.local
```

### Environment Configuration

Edit `.env.local`:

```env
# Binance API Credentials (NEVER commit these!)
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_api_secret_here

# Local development URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Debug mode
NEXT_PUBLIC_DEBUG=false
```

### Test Locally

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

**✅ Verify:**
- Dashboard loads without errors
- API connection successful
- Portfolio data displays correctly
- Dark/light theme toggle works

## ☁️ Step 3: Deploy to Vercel

### Method A: One-Click Deploy (Recommended)

1. **Click Deploy Button**
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gzeu/binance-crypto-dashboard)

2. **Connect GitHub Account**
   - Authorize Vercel to access your repositories
   - Import the `binance-crypto-dashboard` repository

3. **Configure Project**
   - Project Name: `binance-crypto-dashboard`
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)

### Method B: Vercel CLI Deploy

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts:
# - Link to existing project or create new
# - Confirm settings
# - Deploy!
```

## 🔑 Step 4: Environment Variables Setup

### Vercel Dashboard Method

1. **Go to Vercel Dashboard** → Your Project → Settings
2. **Navigate to Environment Variables**
3. **Add Variables:**

| Name | Value | Environments |
|------|-------|-------------|
| `BINANCE_API_KEY` | `your_api_key_here` | Production, Preview |
| `BINANCE_API_SECRET` | `your_secret_here` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production, Preview |

4. **Save and Redeploy**
   - Click "Save"
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment

### Vercel CLI Method

```bash
# Set environment variables via CLI
vercel env add BINANCE_API_KEY
# Paste your API key when prompted

vercel env add BINANCE_API_SECRET
# Paste your API secret when prompted

vercel env add NEXT_PUBLIC_APP_URL
# Enter your Vercel app URL: https://your-app.vercel.app

# Redeploy with new environment variables
vercel --prod
```

## 🏗 Step 5: Verify Production Deployment

### Deployment Checks

1. **Visit Your Dashboard**
   - URL: `https://your-app.vercel.app`
   - Should load within 2-3 seconds

2. **Test Core Functionality**
   - [ ] Portfolio data loads
   - [ ] Asset table displays correctly
   - [ ] Charts render properly
   - [ ] CSV export works
   - [ ] Theme toggle functions
   - [ ] Responsive design on mobile

3. **Check Network Tab (F12)**
   - [ ] API calls to `/api/binance-balance` succeed (200 status)
   - [ ] No console errors
   - [ ] Fast loading times (<2s initial load)

### Performance Verification

```bash
# Test with curl
curl -I https://your-app.vercel.app

# Expected headers:
# - Status: 200 OK
# - Cache-Control: present
# - X-Vercel-Cache: HIT or MISS
```

## 🛠 Step 6: Production Configuration

### Custom Domain (Optional)

1. **Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain**
   - Enter your domain: `dashboard.yourdomain.com`
   - Follow DNS configuration instructions
3. **SSL Certificate**
   - Automatically provisioned by Vercel
   - Usually ready within 24 hours

### Analytics Setup

```bash
# Add Vercel Analytics
npm install @vercel/analytics

# Update app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 📊 Step 7: Monitoring & Maintenance

### Vercel Dashboard Monitoring

- **Functions Tab**: Monitor API route performance
- **Analytics Tab**: Track user interactions
- **Deployments Tab**: View deployment history and logs

### Health Checks

```bash
# Create health check endpoint
# app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  })
}
```

### Regular Maintenance Tasks

- [ ] **Weekly**: Check Vercel deployment logs
- [ ] **Monthly**: Review API usage and performance
- [ ] **Quarterly**: Update dependencies (`npm audit`, `npm update`)
- [ ] **As needed**: Rotate Binance API keys (security best practice)

## 🚨 Troubleshooting Common Issues

### Issue: "API Connection Failed"

**Cause**: Invalid or missing API credentials

**Solution**:
```bash
# Verify environment variables in Vercel
vercel env ls

# Update if missing
vercel env add BINANCE_API_KEY
vercel env add BINANCE_API_SECRET

# Redeploy
vercel --prod
```

### Issue: "Internal Server Error"

**Cause**: Server-side function timeout or error

**Solution**:
1. Check Vercel function logs in dashboard
2. Verify API key permissions on Binance
3. Check rate limiting (max 1200 requests/minute)

### Issue: "Build Failed"

**Cause**: TypeScript errors or missing dependencies

**Solution**:
```bash
# Run type check locally
npm run type-check

# Fix any TypeScript errors
npm run lint

# Commit and push fixes
git add .
git commit -m "Fix build errors"
git push origin main
```

### Issue: Slow Loading

**Cause**: API latency or large bundle size

**Solutions**:
- Enable caching in API routes
- Optimize images and components
- Use Vercel Edge Functions for better performance

## 🔒 Security Checklist for Production

- [ ] API keys are stored in Vercel environment variables only
- [ ] `.env.local` is in `.gitignore`
- [ ] Binance API key has minimal permissions (Read only)
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] No sensitive data in client-side code
- [ ] Regular security updates (`npm audit`)

## 📈 Performance Optimization

### Caching Strategy

```typescript
// app/api/binance-balance/route.ts
export async function GET() {
  const data = await fetchBinanceData()
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
    }
  })
}
```

### Bundle Optimization

```bash
# Analyze bundle size
npm install -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Run analysis
ANALYZE=true npm run build
```

## 🎉 Success! Your Dashboard is Live

Congratulations! Your Binance crypto dashboard is now live on Vercel.

**Next Steps:**
- Share your dashboard URL with team members
- Set up monitoring and alerts
- Plan additional features (price alerts, historical charts, etc.)
- Consider adding authentication for multi-user access

---

**Need Help?** 
- 📖 [Vercel Documentation](https://vercel.com/docs)
- 🔗 [Binance API Docs](https://binance-docs.github.io/apidocs/spot/en/)
- 🐛 [Create Issue on GitHub](https://github.com/Gzeu/binance-crypto-dashboard/issues)

**Built with ❤️ for the crypto community**