# Token Safety Check - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. ✅ [Bun](https://bun.sh) installed locally
2. ✅ GitHub account
3. ✅ Deployment platform account (Railway, Vercel, or Fly.io)
4. ✅ RPC endpoints for blockchain networks
5. ✅ Base network wallet address for receiving payments

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/token-safety-check.git
cd token-safety-check

# Install dependencies
bun install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

Required configuration:

```env
# Server
PORT=3000

# Payment (use your address)
PAYMENT_ADDRESS=0xYourWalletAddressHere

# RPC URLs (recommended to use your own for reliability)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed1.binance.org
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

### 3. Test Locally

```bash
# Start development server
bun run dev

# In another terminal, test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/.well-known/agent.json
```

### 4. Run Tests

```bash
# Run test suite
bun test test.ts

# Should see all tests passing
```

## Production Deployment

### Option 1: Railway (Recommended)

Railway provides the easiest deployment with automatic HTTPS.

#### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/token-safety-check.git
git push -u origin main
```

#### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `token-safety-check` repository
5. Railway will auto-detect Bun and deploy

#### Step 3: Configure Environment Variables

In Railway dashboard:

1. Go to your project → Variables
2. Add each variable from your `.env` file:
   - `PAYMENT_ADDRESS`
   - `ETHEREUM_RPC_URL`
   - `BSC_RPC_URL`
   - etc.

#### Step 4: Get Your Domain

Railway automatically provides a domain like:
```
https://token-safety-check-production.up.railway.app
```

You can also add a custom domain in Settings → Domains.

#### Step 5: Verify Deployment

```bash
# Test your production deployment
curl https://your-domain.railway.app/health
curl https://your-domain.railway.app/.well-known/agent.json
```

### Option 2: Vercel

Vercel is great for edge deployments with global CDN.

#### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# Deploy to production
vercel --prod
```

#### Configure

1. Add environment variables in Vercel dashboard
2. Set build command: `bun install`
3. Set output directory: `.`
4. Framework preset: Other

### Option 3: Fly.io

Fly.io offers great global distribution and edge compute.

#### Deploy

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Follow prompts, then deploy
fly deploy
```

#### Configure

Add secrets:
```bash
fly secrets set PAYMENT_ADDRESS=0x...
fly secrets set ETHEREUM_RPC_URL=https://...
# ... etc for all RPC URLs
```

### Option 4: Docker + Any VPS

Deploy to any VPS using Docker.

#### Build Image

```bash
# Build
docker build -t token-safety-check .

# Test locally
docker run -p 3000:3000 --env-file .env token-safety-check
```

#### Deploy to VPS

```bash
# SSH to your server
ssh user@your-server.com

# Pull your image or build on server
docker pull yourusername/token-safety-check
# or
git clone https://github.com/yourusername/token-safety-check.git
cd token-safety-check
docker build -t token-safety-check .

# Run with docker-compose
docker-compose up -d
```

Sample `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    image: token-safety-check
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - PAYMENT_ADDRESS=${PAYMENT_ADDRESS}
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
      # ... add all env vars
    restart: unless-stopped
```

## Post-Deployment Checklist

After deploying, verify everything works:

### 1. Health Check
```bash
curl https://your-domain.com/health
# Should return: {"ok":true,"version":"1.0.0"}
```

### 2. Agent Manifest
```bash
curl https://your-domain.com/.well-known/agent.json | jq
# Should return full manifest with entrypoints, payments, etc.
```

### 3. Test Token Analysis
```bash
# Test with USDC (safe token)
curl -X POST https://your-domain.com/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }'
```

Note: Without X-Payment header, this will return 402 Payment Required in production.

### 4. Verify x402 Configuration
```bash
# Check payment metadata
curl https://your-domain.com/.well-known/agent.json | jq '.payments'
```

Should show:
```json
[
  {
    "method": "x402",
    "network": "base",
    "payee": "0x...",
    ...
  }
]
```

## RPC Provider Recommendations

For production, consider using dedicated RPC providers:

### Free Tier Options
- **Ankr**: https://www.ankr.com/rpc/
- **Chainlist**: https://chainlist.org/
- **LlamaNodes**: https://llamarpc.com/

### Paid Options (More Reliable)
- **Alchemy**: https://www.alchemy.com/
- **Infura**: https://www.infura.io/
- **QuickNode**: https://www.quicknode.com/
- **Moralis**: https://moralis.io/

### Example .env with Alchemy

```env
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BSC_RPC_URL=https://bsc-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

## Monitoring & Maintenance

### Set Up Monitoring

1. **Uptime Monitoring**
   - Use [UptimeRobot](https://uptimerobot.com/) or [Pingdom](https://www.pingdom.com/)
   - Monitor: `https://your-domain.com/health`
   - Check interval: 5 minutes

2. **Error Tracking**
   - Railway: Built-in logs
   - Add [Sentry](https://sentry.io/) for error tracking
   - Add [LogTail](https://logtail.com/) for log aggregation

3. **Performance Monitoring**
   - Monitor response times
   - Track API usage
   - Monitor RPC provider limits

### Logs

View logs based on platform:

```bash
# Railway
railway logs

# Vercel
vercel logs

# Fly.io
fly logs

# Docker
docker logs container-name -f
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: App crashed or not starting  
**Solution**: Check logs for errors, verify environment variables

### Issue: Slow Response Times

**Cause**: RPC provider latency  
**Solution**: Use faster RPC providers, consider caching

### Issue: 402 Payment Required on All Requests

**Cause**: x402 middleware misconfigured  
**Solution**: Verify PAYMENT_ADDRESS and FACILITATOR_URL are set

### Issue: "Chain not supported" Errors

**Cause**: Missing RPC URL for that chain  
**Solution**: Add the RPC URL to environment variables

### Issue: Analysis Returns Error

**Cause**: RPC provider down or rate limited  
**Solution**: Check RPC provider status, consider fallback URLs

## Scaling Considerations

### For High Traffic

1. **Add Caching**
   - Use Redis to cache results for 5-10 minutes
   - Cache key: `token:{address}:{chain_id}`

2. **Rate Limiting**
   - Implement rate limiting per IP
   - Use Cloudflare or similar

3. **Multiple Instances**
   - Deploy to multiple regions
   - Use load balancer

4. **Database**
   - Store historical analysis
   - Track reputation over time

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Keep dependencies updated (`bun update`)
3. ✅ Don't commit `.env` to git
4. ✅ Use environment variables for secrets
5. ✅ Enable CORS only for trusted domains (if needed)
6. ✅ Implement rate limiting
7. ✅ Monitor for unusual activity
8. ✅ Regularly rotate RPC API keys

## Cost Estimation

### Free Tier Possible
- Railway: 500 hours/month free
- Vercel: 100GB bandwidth free
- Free RPC endpoints

### Paid Tier (Recommended for Production)
- Railway Pro: $5/month
- Alchemy Growth: $49/month (300M compute units)
- Total: ~$54/month for reliable service

### Revenue
At 0.02 USDC per check:
- 100 checks/day = $2/day = $60/month
- 500 checks/day = $10/day = $300/month
- Break-even: ~2,700 checks/month

## Next Steps

1. ✅ Deploy to production
2. ✅ Test all endpoints
3. ✅ Submit bounty (see SUBMISSION.md)
4. ✅ Monitor initial usage
5. ✅ Gather feedback
6. ✅ Iterate and improve

## Support

- **GitHub Issues**: https://github.com/yourusername/token-safety-check/issues
- **Daydreams Discord**: https://discord.gg/daydreams
- **Agent Kit Docs**: https://www.npmjs.com/package/@lucid-dreams/agent-kit

---

Good luck with your deployment! 🚀
