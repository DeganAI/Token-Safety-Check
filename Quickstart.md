# Token Safety Check - Quick Start Guide

Get your Token Safety Check agent running in 5 minutes! 🚀

## Prerequisites

- [Bun](https://bun.sh) installed
- A wallet address for receiving payments
- (Optional) RPC endpoints for blockchain networks

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/token-safety-check.git
cd token-safety-check

# Install dependencies
bun install
```

## Step 2: Configure

```bash
# Copy environment template
cp .env.example .env

# Edit with your wallet address
nano .env
```

Minimum required configuration:
```env
PAYMENT_ADDRESS=0xYourWalletAddressHere
```

## Step 3: Run Locally

```bash
# Start development server
bun run dev
```

You should see:
```
🚀 Token Safety Check starting on port 3000...
📊 Supported chains: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche
💰 Payment: 0.02 USDC via x402 on Base

✅ Server running at http://localhost:3000
📖 API docs: http://localhost:3000/.well-known/agent.json
❤️  Health check: http://localhost:3000/health
```

## Step 4: Test It

Open a new terminal and try:

```bash
# Health check
curl http://localhost:3000/health

# Should return: {"ok":true,"version":"1.0.0"}
```

Check a token (USDC on Ethereum):
```bash
curl -X POST http://localhost:3000/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }'
```

You should get a detailed safety analysis!

## Step 5: Deploy to Production

### Option A: Railway (Easiest)

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your repo
4. Add environment variable: `PAYMENT_ADDRESS=0x...`
5. Deploy! ✨

### Option B: Other Platforms

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions for:
- Vercel
- Fly.io
- Docker + VPS

## What's Next?

1. ✅ **Get RPC URLs**: Use [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) for better reliability
2. ✅ **Test thoroughly**: Try different tokens across chains
3. ✅ **Submit bounty**: Follow [SUBMISSION.md](./SUBMISSION.md) to claim your $1,000
4. ✅ **Monitor**: Set up uptime monitoring
5. ✅ **Share**: Let the community know about your agent!

## Common Issues

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules
bun install
```

### "Chain not supported"
Add RPC URL to `.env`:
```env
ETHEREUM_RPC_URL=https://eth.llamarpc.com
```

### "Port already in use"
Change port in `.env`:
```env
PORT=3001
```

## Testing Different Tokens

### Safe Token (USDC)
```json
{
  "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chain_id": 1
}
```
Expected: High safety score, SAFE risk level

### Another Safe Token (WETH)
```json
{
  "token_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "chain_id": 1
}
```

### BSC Token (USDT)
```json
{
  "token_address": "0x55d398326f99059fF775485246999027B3197955",
  "chain_id": 56
}
```

## Documentation

- **Full README**: [README.md](./README.md)
- **API Examples**: [EXAMPLES.md](./EXAMPLES.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Bounty Submission**: [SUBMISSION.md](./SUBMISSION.md)

## Need Help?

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/token-safety-check/issues)
- **Daydreams Discord**: [Join community](https://discord.gg/daydreams)
- **Agent Kit Docs**: [Read docs](https://www.npmjs.com/package/@lucid-dreams/agent-kit)

---

**Ready to protect users from scam tokens!** 🛡️

Remember: This agent helps prevent millions in losses from honeypot scams. Your work matters! 💪
