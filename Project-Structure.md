# Token Safety Check - Project Structure

Complete file structure for the **Token Safety Check** Daydreams x402 agent.

```
token-safety-check/
├── src/
│   ├── index.ts                    # Main agent application (createAgentApp)
│   └── analyzers/
│       ├── honeypot-checker.ts     # Honeypot.is API integration
│       ├── onchain-analyzer.ts     # Web3 blockchain analysis
│       └── scoring-engine.ts       # Result aggregation & risk scoring
│
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── bun.lockb                       # Bun lock file (auto-generated)
│
├── .env.example                    # Environment template
├── .env                            # Your environment (don't commit!)
├── .gitignore                      # Git ignore rules
├── .dockerignore                   # Docker ignore rules
│
├── Dockerfile                      # Production Docker build
├── docker-compose.yml              # Local Docker development
│
├── test.ts                         # Test suite
│
├── README.md                       # Main documentation
├── QUICKSTART.md                   # 5-minute setup guide
├── DEPLOYMENT.md                   # Production deployment guide
├── EXAMPLES.md                     # Integration examples
├── SUBMISSION.md                   # Bounty submission template
├── LICENSE                         # MIT License
│
└── node_modules/                   # Dependencies (auto-generated)
```

## File Descriptions

### Core Application (`src/`)

#### `src/index.ts`
- **Purpose**: Main agent application
- **Key Features**:
  - Creates agent app with `createAgentApp`
  - Defines `check-token-safety` entrypoint
  - Configures x402 payments (0.02 USDC on Base)
  - Initializes analyzers with RPC URLs
  - Handles requests and coordinates analysis
  - Serves discovery endpoints

#### `src/analyzers/honeypot-checker.ts`
- **Purpose**: Honeypot detection via external API
- **Data Source**: honeypot.is API
- **Checks**:
  - Buy/sell/transfer taxes
  - Holder concentration
  - Contract verification
  - Proxy detection
  - Honeypot simulation
- **Output**: Risk score 0-100, warnings, metadata

#### `src/analyzers/onchain-analyzer.ts`
- **Purpose**: Direct blockchain verification
- **Technology**: Web3.js
- **Checks**:
  - Contract existence
  - ERC20 compliance
  - Token metadata (name, symbol, decimals)
  - Code size analysis
  - Supply validation
- **Output**: Risk score 0-100, compliance status

#### `src/analyzers/scoring-engine.ts`
- **Purpose**: Aggregate results into final score
- **Algorithm**: 
  - 60% weight to honeypot.is
  - 40% weight to on-chain analysis
- **Features**:
  - Risk level categorization (SAFE → CRITICAL)
  - Confidence calculation (0.0-1.0)
  - Warning generation
  - Recommendation synthesis
- **Output**: Complete `SafetyResult`

### Configuration

#### `package.json`
- Dependencies: agent-kit, hono, zod, web3
- Scripts: dev, start, build
- Type: ESM module

#### `tsconfig.json`
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- Bun types included

#### `.env.example`
- Template for environment variables
- Documents all required/optional config
- Safe to commit (no secrets)

#### `.env`
- Your actual configuration
- **Never commit this file**
- Contains:
  - Payment address
  - RPC URLs
  - API keys

### Docker & Deployment

#### `Dockerfile`
- Multi-stage build for optimization
- Production-ready Bun runtime
- Minimal final image
- Health checks included

#### `docker-compose.yml`
- Local development setup
- Environment variable mapping
- Health check configuration
- Auto-restart enabled

### Testing

#### `test.ts`
- Comprehensive test suite
- Tests all endpoints
- Validates schemas
- Checks multi-chain support
- Verifies payment configuration

### Documentation

#### `README.md`
- **Main documentation**
- Features overview
- API reference
- Configuration guide
- Architecture diagrams
- Deployment options

#### `QUICKSTART.md`
- **5-minute setup guide**
- Step-by-step instructions
- Common issues & solutions
- Quick testing commands

#### `DEPLOYMENT.md`
- **Production deployment guide**
- Platform-specific instructions (Railway, Vercel, Fly.io, Docker)
- RPC provider recommendations
- Monitoring setup
- Scaling considerations
- Security best practices

#### `EXAMPLES.md`
- **Integration examples**
- Multiple languages (TypeScript, Python, Node.js)
- Use cases (DEX integration, bot protection, portfolio analysis)
- Response interpretation
- Error handling patterns

#### `SUBMISSION.md`
- **Bounty submission template**
- Acceptance criteria checklist
- Technical specifications
- Testing evidence
- Payment information

#### `LICENSE`
- MIT License
- Open source

## Technology Stack

### Runtime
- **Bun**: Fast JavaScript runtime
- **TypeScript**: Type-safe development

### Framework
- **@lucid-dreams/agent-kit**: Agent framework
- **Hono**: Lightweight HTTP server
- **Zod**: Schema validation

### Blockchain
- **Web3.js**: Ethereum interaction
- **Multiple RPC providers**: Chain support

### Payment
- **x402 protocol**: Micropayments
- **Base network**: L2 for low fees
- **USDC**: Stablecoin payment

## Key Features

✅ **Type-safe**: Full TypeScript with Zod validation
✅ **Multi-source**: Combines API + blockchain data
✅ **Weighted scoring**: Intelligent risk assessment
✅ **Multi-chain**: 7 major networks supported
✅ **Payment-ready**: x402 integration built-in
✅ **Production-ready**: Docker, health checks, monitoring
✅ **Well-documented**: Comprehensive guides for all scenarios
✅ **Tested**: Full test suite included

## Getting Started

1. **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
2. **Full Setup**: [README.md](./README.md)
3. **Deploy**: [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Integrate**: [EXAMPLES.md](./EXAMPLES.md)
5. **Submit Bounty**: [SUBMISSION.md](./SUBMISSION.md)

## Development Workflow

```bash
# 1. Install
bun install

# 2. Configure
cp .env.example .env
# Edit .env

# 3. Develop
bun run dev

# 4. Test
bun test test.ts

# 5. Build
bun run build

# 6. Deploy
# See DEPLOYMENT.md
```

## File Sizes (Approximate)

```
src/index.ts              ~250 lines
src/analyzers/*           ~200 lines each
README.md                 ~600 lines
DEPLOYMENT.md             ~400 lines
EXAMPLES.md               ~500 lines
test.ts                   ~200 lines

Total source code:        ~1,000 lines
Total documentation:      ~2,000 lines
```

## Dependencies Size

```
node_modules/             ~50 MB
Built bundle:             ~5 MB
Docker image:             ~150 MB
```

## API Endpoints

```
GET  /                                          Service info
GET  /health                                    Health check
GET  /entrypoints                               List entrypoints
GET  /.well-known/agent.json                    Agent manifest
POST /entrypoints/check-token-safety/invoke    Analyze token
```

## Environment Variables

### Required
- `PAYMENT_ADDRESS` - Your wallet for receiving payments

### Optional (Recommended)
- `PORT` - Server port (default: 3000)
- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint
- `BSC_RPC_URL` - BSC RPC endpoint
- `POLYGON_RPC_URL` - Polygon RPC endpoint
- `ARBITRUM_RPC_URL` - Arbitrum RPC endpoint
- `OPTIMISM_RPC_URL` - Optimism RPC endpoint
- `BASE_RPC_URL` - Base RPC endpoint
- `AVALANCHE_RPC_URL` - Avalanche RPC endpoint

### Auto-Configured
- `FACILITATOR_URL` - Default: https://facilitator.daydreams.systems
- `NETWORK` - Default: base
- `DEFAULT_PRICE` - Default: 20000 (0.02 USDC)

## Support Resources

- **Documentation**: All .md files in root
- **GitHub Issues**: Report bugs or request features
- **Daydreams Discord**: Community support
- **Agent Kit Docs**: Framework reference

---

**Project Status**: ✅ Production Ready

Built for the Daydreams AI Agent Bounties program.
