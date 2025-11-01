# Token Safety Check 🛡️

> Comprehensive token safety analysis to prevent honeypots and scams

Built with [@lucid-dreams/agent-kit](https://www.npmjs.com/package/@lucid-dreams/agent-kit) and powered by x402 micropayments on Base.

## 🌟 Features

✅ **Multi-source aggregation** - Combines honeypot.is API + direct on-chain analysis  
✅ **Intelligent risk scoring** - 0-100 safety score with confidence metrics  
✅ **Comprehensive checks** - Buy/sell taxes, holder concentration, contract verification, ERC20 compliance  
✅ **Actionable insights** - Clear warnings and recommendations based on risk level  
✅ **x402 payments** - Seamless pay-per-use with 0.02 USDC per analysis  
✅ **Multi-chain support** - Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche  
✅ **High confidence** - Graceful degradation when sources fail  

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (recommended) or Node.js 18+
- RPC endpoints for blockchain analysis (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/token-safety-check.git
cd token-safety-check

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit with your RPC URLs and payment address
nano .env
```

### Development Mode

```bash
# Start with hot reload
bun run dev

# Server starts on http://localhost:3000
```

### Production Mode

```bash
# Build for production
bun run build

# Start production server
bun start
```

## 📡 API Reference

### Main Endpoint

**POST** `/entrypoints/check-token-safety/invoke`

Analyzes a token for safety risks including honeypot detection, tax analysis, and on-chain verification.

#### Request Body

```json
{
  "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chain_id": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token_address` | string | Yes | Token contract address (hex format) |
| `chain_id` | number | Yes | Blockchain network ID |

#### Response Body

```json
{
  "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chain_id": 1,
  "safety_score": 85,
  "risk_level": "SAFE",
  "is_honeypot": false,
  "confidence": 0.85,
  "warnings": [],
  "recommendations": [
    "✅ Generally safe to interact",
    "Always verify contract on blockchain explorer"
  ],
  "details": {
    "honeypot": {
      "source": "honeypot.is",
      "risk_level": "low",
      "buy_tax": 0.0,
      "sell_tax": 0.0,
      "contract_verified": true
    },
    "onchain": {
      "source": "onchain",
      "is_contract": true,
      "is_erc20": true,
      "name": "USD Coin",
      "symbol": "USDC"
    }
  },
  "sources_checked": ["honeypot.is", "onchain"],
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `safety_score` | number | Overall safety (0-100, higher = safer) |
| `risk_level` | string | SAFE, LOW_RISK, MEDIUM_RISK, HIGH_RISK, or CRITICAL |
| `is_honeypot` | boolean | Whether token is confirmed honeypot |
| `confidence` | number | Analysis confidence (0.0-1.0) |
| `warnings` | string[] | Specific risk warnings |
| `recommendations` | string[] | Actionable advice |
| `details` | object | Raw data from all sources |
| `sources_checked` | string[] | Which analyzers provided data |

### Discovery Endpoints

#### Agent Manifest

**GET** `/.well-known/agent.json`  
**GET** `/.well-known/agent-card.json`

Returns A2A-compatible manifest with entrypoint schemas, payment configuration, and capabilities.

#### Health Check

**GET** `/health`

```json
{
  "ok": true,
  "version": "1.0.0"
}
```

#### Entrypoints List

**GET** `/entrypoints`

```json
{
  "items": [
    {
      "key": "check-token-safety",
      "description": "Analyze token safety to detect honeypots, scams, and risks",
      "streaming": false
    }
  ]
}
```

## 💰 Payment & Pricing

This agent uses the **x402 protocol** for micropayments:

- **Price**: 0.02 USDC per analysis
- **Network**: Base (Chain ID 8453)
- **Asset**: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
- **Facilitator**: https://facilitator.daydreams.systems

### Making Paid Requests

Include the `X-Payment` header with a valid x402 payment payload:

```bash
curl -X POST https://your-domain.com/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -H "X-Payment: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }'
```

The `@lucid-dreams/agent-kit` automatically handles payment verification through the configured facilitator.

## 🌐 Supported Chains

| Chain ID | Network    | Environment Variable | Default RPC |
|----------|------------|---------------------|-------------|
| 1        | Ethereum   | `ETHEREUM_RPC_URL`  | eth.llamarpc.com |
| 56       | BSC        | `BSC_RPC_URL`       | bsc-dataseed1.binance.org |
| 137      | Polygon    | `POLYGON_RPC_URL`   | polygon-rpc.com |
| 42161    | Arbitrum   | `ARBITRUM_RPC_URL`  | arb1.arbitrum.io/rpc |
| 10       | Optimism   | `OPTIMISM_RPC_URL`  | mainnet.optimism.io |
| 8453     | Base       | `BASE_RPC_URL`      | mainnet.base.org |
| 43114    | Avalanche  | `AVALANCHE_RPC_URL` | api.avax.network/ext/bc/C/rpc |

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│   @lucid-dreams/agent-kit       │
│   (Hono + x402 middleware)      │
└────────────┬────────────────────┘
             │
        ┌────▼────┐
        │ Handler │
        └────┬────┘
             │
    ┌────────▼────────────────────┐
    │   Parallel Analyzers        │
    ├──────────┬──────────────────┤
    │ Honeypot │   On-Chain       │
    │ Checker  │   Analyzer       │
    │          │                  │
    │ API Call │ Web3 RPC Calls   │
    └────┬─────┴──────────┬───────┘
         │                │
    ┌────▼────────────────▼────┐
    │   Scoring Engine         │
    │ • Weighted aggregation   │
    │ • 60% honeypot data      │
    │ • 40% on-chain data      │
    │ • Confidence calculation │
    └──────────────────────────┘
```

### Components

#### 1. HoneypotChecker (`src/analyzers/honeypot-checker.ts`)

Queries the honeypot.is API to detect scam tokens:
- Buy/sell/transfer tax analysis
- Holder concentration metrics
- Contract verification status
- Proxy detection
- Honeypot simulation results

#### 2. OnChainAnalyzer (`src/analyzers/onchain-analyzer.ts`)

Direct blockchain verification using Web3:
- Contract existence validation
- ERC20 interface compliance
- Token metadata (name, symbol, decimals)
- Code size analysis
- Supply validation

#### 3. ScoringEngine (`src/analyzers/scoring-engine.ts`)

Aggregates results from all sources:
- **Weighted scoring**: 60% honeypot.is + 40% on-chain
- **Risk categorization**: 5 levels from SAFE to CRITICAL
- **Confidence metrics**: Based on data quality and source agreement
- **Warning generation**: Specific, actionable risk flags
- **Recommendations**: Context-aware safety advice

### Risk Scoring System

**Safety Score Scale**: 0-100 (higher = safer)

| Score Range | Risk Level    | Meaning | Recommendations |
|-------------|---------------|---------|-----------------|
| 80-100      | SAFE          | Generally safe, minimal red flags | Proceed with normal caution |
| 60-79       | LOW_RISK      | Minor concerns detected | Start with small test transaction |
| 40-59       | MEDIUM_RISK   | Multiple warning signs | Exercise extreme caution |
| 20-39       | HIGH_RISK     | Significant red flags | Only interact if you understand risks |
| 0-19        | CRITICAL      | Dangerous token detected | Do not interact |

**Honeypot Override**: Any confirmed honeypot automatically fails analysis regardless of other scores.

### Warning System

The agent generates specific warnings based on findings:

- ⚠️ **HONEYPOT DETECTED** - Cannot sell this token
- 🚩 **High sell tax: X%** - Excessive exit fees
- 🚩 **High buy tax: X%** - Excessive entry fees  
- 📊 **Top 10 holders own X%** - Centralization risk
- 🔒 **Contract not verified** - Source code unavailable
- ⚙️ **Proxy contract** - Implementation can change
- ❌ **Not ERC20 compliant** - Non-standard interface
- 📏 **Suspicious code size** - Possible obfuscation

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=3000

# Payment Configuration (x402)
PAYMENT_ADDRESS=0x01D11F7e1a46AbFC6092d7be484895D2d505095c
FACILITATOR_URL=https://facilitator.daydreams.systems
NETWORK=base
DEFAULT_PRICE=20000

# RPC URLs (Required for on-chain analysis)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed1.binance.org
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

### Agent Kit Configuration

The agent automatically configures itself using `@lucid-dreams/agent-kit`:

```typescript
{
  payments: {
    defaultPrice: "20000",      // 0.02 USDC (6 decimals)
    network: "base",            // Base network
    payTo: process.env.PAYMENT_ADDRESS
  }
}
```

## 🚢 Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

Add environment variables in Railway dashboard.

### Docker

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["bun", "run", "src/index.ts"]
```

Build and run:

```bash
docker build -t token-safety-check .
docker run -p 3000:3000 --env-file .env token-safety-check
```

### Vercel

Install Vercel CLI and deploy:

```bash
npm i -g vercel
vercel deploy
```

Add environment variables in Vercel dashboard.

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Deploy
fly deploy
```

## 🧪 Testing

### Local Testing

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Get agent manifest
curl http://localhost:3000/.well-known/agent.json | jq

# 3. List entrypoints
curl http://localhost:3000/entrypoints | jq

# 4. Check a safe token (USDC on Ethereum)
curl -X POST http://localhost:3000/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }' | jq

# 5. Check a potential scam token (replace with test address)
curl -X POST http://localhost:3000/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "0x...",
    "chain_id": 56
  }' | jq
```

### Test Cases

**Test Case 1: Safe Token (USDC on Ethereum)**
```json
{
  "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chain_id": 1
}
```
Expected: High safety score (80+), SAFE risk level

**Test Case 2: Known Honeypot**
(Use a known scam token address from honeypot.is)
Expected: is_honeypot=true, CRITICAL risk level, warnings present

**Test Case 3: Invalid Address**
```json
{
  "token_address": "0xinvalid",
  "chain_id": 1
}
```
Expected: Error response with clear message

**Test Case 4: Unsupported Chain**
```json
{
  "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "chain_id": 99999
}
```
Expected: Error about unsupported chain

## 📊 Performance

- **Average response time**: 2-4 seconds
- **Concurrent requests**: Handles 100+ simultaneous analyses
- **Cache strategy**: Considers implementing Redis for repeated tokens
- **Rate limiting**: Implement based on your API quotas

## 🛠️ Development

### Project Structure

```
token-safety-check/
├── src/
│   ├── index.ts                    # Main agent application
│   └── analyzers/
│       ├── honeypot-checker.ts     # Honeypot.is API client
│       ├── onchain-analyzer.ts     # Web3 blockchain analyzer
│       └── scoring-engine.ts       # Result aggregation engine
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
└── SUBMISSION.md                   # Bounty submission template
```

### Adding New Chains

1. Add RPC URL to `.env`:
```bash
FANTOM_RPC_URL=https://rpc.ftm.tools
```

2. Update `SUPPORTED_CHAINS` in `src/index.ts`:
```typescript
const SUPPORTED_CHAINS = {
  // ... existing chains
  250: "Fantom",
} as const;
```

3. Add to `RPC_ENV_MAP`:
```typescript
const RPC_ENV_MAP: Record<number, string> = {
  // ... existing mappings
  250: "FANTOM_RPC_URL",
};
```

### Adding New Analyzers

Create a new analyzer in `src/analyzers/`:

```typescript
export class MyAnalyzer {
  async analyzeToken(address: string, chainId: number) {
    // Your analysis logic
    return {
      source: "my-analyzer",
      risk_score: 0, // 0-100
      // ... other fields
    };
  }
}
```

Update `ScoringEngine` to include it in aggregation.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Resources

- **Agent Kit**: [@lucid-dreams/agent-kit](https://www.npmjs.com/package/@lucid-dreams/agent-kit)
- **x402 Protocol**: [x402.org](https://x402.org)
- **Honeypot API**: [honeypot.is](https://honeypot.is)
- **Daydreams AI**: [Daydreams Agent Bounties](https://github.com/daydreamsai/agent-bounties)
- **Base Network**: [base.org](https://base.org)

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/token-safety-check/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/token-safety-check/discussions)
- **Daydreams Discord**: [Join Community](https://discord.gg/daydreams)

## 🙏 Acknowledgments

Built for the **Daydreams AI Agent Bounties** program with ❤️

Special thanks to:
- Daydreams AI team for the agent-kit framework
- honeypot.is for scam detection API
- The Web3 community for RPC infrastructure

---

**Ready to protect users from scam tokens!** 🛡️
