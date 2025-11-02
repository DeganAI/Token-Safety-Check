/**
 * Token Safety Check - Lucid x402 Agent
 * 
 * A comprehensive token safety analysis service that detects honeypots,
 * scams, and risky tokens across multiple blockchain networks.
 * 
 * Powered by x402 micropayments on Base network.
 * Built for AI agents using the Lucid protocol.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { HoneypotChecker } from "./analyzers/honeypot-checker";
import { OnChainAnalyzer } from "./analyzers/onchain-analyzer";
import { ScoringEngine } from "./analyzers/scoring-engine";

// Environment configuration
const PORT = process.env.PORT || 3000;
const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS || "0x01D11F7e1a46AbFC6092d7be484895D2d505095c";
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems";
const NETWORK = process.env.NETWORK || "base";
const DEFAULT_PRICE = parseInt(process.env.DEFAULT_PRICE || "20000");
const SERVICE_URL = process.env.SERVICE_URL || `http://localhost:${PORT}`;

// RPC URLs configuration
const RPC_URLS: Record<number, string> = {
  1: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
  56: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
  137: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
  42161: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
  10: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
  8453: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  43114: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
};

// Chain ID to name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  56: "BSC",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
  43114: "Avalanche",
};

// Initialize analyzers
const honeypotChecker = new HoneypotChecker({ verbose: false });
const onchainAnalyzer = new OnChainAnalyzer(RPC_URLS, { verbose: false });
const scoringEngine = new ScoringEngine({ verbose: false });

// Input validation schema
const TokenCheckSchema = z.object({
  token_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  chain_id: z.number().int().positive(),
});

// Create Hono app
const app = new Hono();

// Middleware
app.use("/*", cors());

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    ok: true,
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ========================================
// LUCID AGENT PROTOCOL - x402 Integration
// ========================================

// Agent manifest (Lucid Discovery)
app.get("/.well-known/agent.json", (c) => {
  const manifest = {
    "@context": "https://lucid.app/agent/v1",
    id: "token-safety-check",
    name: "Token Safety Check",
    version: "1.0.0",
    description: "AI-powered token safety analyzer that detects honeypots, scams, and risky tokens across 7 blockchain networks. Protects users from malicious tokens before they invest.",
    
    // x402 Payment Configuration
    payment: {
      protocol: "x402",
      address: PAYMENT_ADDRESS,
      facilitatorUrl: FACILITATOR_URL,
      network: NETWORK,
      currency: "USDC",
      pricePerRequest: DEFAULT_PRICE,
      priceDisplay: `${(DEFAULT_PRICE / 1000000).toFixed(2)} USDC`,
    },

    // Capabilities
    capabilities: [
      "token-analysis",
      "honeypot-detection",
      "scam-prevention",
      "multi-chain-support",
      "real-time-analysis",
    ],

    // Actions (what AI agents can do)
    actions: [
      {
        name: "check-token-safety",
        displayName: "Check Token Safety",
        description: "Analyze a token for honeypots, high taxes, centralization risks, and technical issues. Returns comprehensive safety assessment with actionable recommendations.",
        
        endpoint: {
          method: "POST",
          path: "/api/v1/analyze",
          contentType: "application/json",
        },

        input: {
          type: "object",
          properties: {
            token_address: {
              type: "string",
              description: "Token contract address (0x-prefixed hex)",
              pattern: "^0x[a-fA-F0-9]{40}$",
              example: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            },
            chain_id: {
              type: "integer",
              description: "Blockchain network identifier",
              enum: [1, 56, 137, 42161, 10, 8453, 43114],
              enumNames: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche"],
              example: 1,
            },
          },
          required: ["token_address", "chain_id"],
        },

        output: {
          type: "object",
          properties: {
            safety_score: {
              type: "number",
              description: "Overall safety score from 0-100 (higher = safer)",
              minimum: 0,
              maximum: 100,
            },
            risk_level: {
              type: "string",
              enum: ["SAFE", "LOW_RISK", "MEDIUM_RISK", "HIGH_RISK", "CRITICAL"],
              description: "Categorical risk assessment",
            },
            is_honeypot: {
              type: "boolean",
              description: "True if token is confirmed honeypot scam",
            },
            confidence: {
              type: "number",
              description: "Analysis confidence from 0.0-1.0",
              minimum: 0,
              maximum: 1,
            },
            warnings: {
              type: "array",
              items: { type: "string" },
              description: "Specific risk warnings found",
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Actionable safety recommendations",
            },
            metadata: {
              type: "object",
              description: "Additional risk categorization",
            },
          },
        },

        examples: [
          {
            name: "Check USDC on Ethereum",
            input: {
              token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              chain_id: 1,
            },
            output: {
              safety_score: 95,
              risk_level: "SAFE",
              is_honeypot: false,
              confidence: 0.95,
              warnings: [],
              recommendations: ["✅ Generally safe to interact"],
            },
          },
        ],

        pricing: {
          amount: DEFAULT_PRICE,
          currency: "USDC",
          display: `${(DEFAULT_PRICE / 1000000).toFixed(2)} USDC per analysis`,
        },
      },
    ],

    // Metadata
    metadata: {
      author: "DeganAI",
      homepage: "https://github.com/DeganAI/Token-Safety-Check",
      repository: "https://github.com/DeganAI/Token-Safety-Check",
      license: "MIT",
      supportedChains: Object.entries(CHAIN_NAMES).map(([id, name]) => ({
        chainId: parseInt(id),
        name,
      })),
      dataSources: [
        {
          name: "honeypot.is",
          description: "Honeypot detection and simulation",
          weight: 0.6,
        },
        {
          name: "on-chain",
          description: "Direct blockchain verification via Web3",
          weight: 0.4,
        },
      ],
    },

    // Links for discovery
    links: {
      self: `${SERVICE_URL}/.well-known/agent.json`,
      documentation: `${SERVICE_URL}/docs`,
      health: `${SERVICE_URL}/health`,
      analyze: `${SERVICE_URL}/api/v1/analyze`,
    },
  };

  return c.json(manifest);
});

// ========================================
// MAIN API ENDPOINT - Token Analysis
// ========================================

app.post("/api/v1/analyze", async (c) => {
  const startTime = Date.now();

  try {
    // Parse and validate input
    const body = await c.req.json();
    const input = TokenCheckSchema.parse(body);

    console.log(`\n🔍 [${new Date().toISOString()}] Analyzing token ${input.token_address} on chain ${input.chain_id}...`);

    // Check if chain is supported
    if (!onchainAnalyzer.isChainSupported(input.chain_id)) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_CHAIN",
            message: `Chain ID ${input.chain_id} is not supported`,
            supportedChains: onchainAnalyzer.getSupportedChains(),
          },
        },
        400
      );
    }

    // Run both analyzers in parallel
    const [honeypotData, onchainData] = await Promise.all([
      honeypotChecker.checkToken(input.token_address, input.chain_id),
      onchainAnalyzer.analyzeToken(input.token_address, input.chain_id),
    ]);

    // Aggregate results
    const result = scoringEngine.aggregateResults(honeypotData, onchainData);

    const processingTime = Date.now() - startTime;

    // Log summary
    console.log(`✅ Analysis complete in ${processingTime}ms:`);
    console.log(`   Safety Score: ${result.safety_score}/100`);
    console.log(`   Risk Level: ${result.risk_level}`);
    console.log(`   Is Honeypot: ${result.is_honeypot}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);

    // Return Lucid-compatible response
    return c.json({
      success: true,
      data: {
        // Token identification
        token: {
          address: input.token_address,
          chainId: input.chain_id,
          chainName: CHAIN_NAMES[input.chain_id] || "Unknown",
          name: honeypotData.metadata?.token_name || onchainData.name,
          symbol: honeypotData.metadata?.token_symbol || onchainData.symbol,
        },

        // Safety analysis
        analysis: {
          safetyScore: result.safety_score,
          riskLevel: result.risk_level,
          isHoneypot: result.is_honeypot,
          confidence: result.confidence,
          
          // Detailed findings
          warnings: result.warnings,
          recommendations: result.recommendations,
          
          // Risk breakdown
          risks: {
            tax: result.metadata?.tax_risk || "unknown",
            centralization: result.metadata?.centralization_risk || "unknown",
            technical: result.metadata?.technical_risk || "unknown",
          },

          // Data sources
          sources: result.sources_checked,
          redFlags: result.metadata?.red_flags_count || 0,
          passedBasicChecks: result.metadata?.passed_basic_checks || false,
        },

        // Technical details
        details: {
          honeypot: {
            buyTax: honeypotData.buy_tax,
            sellTax: honeypotData.sell_tax,
            transferTax: honeypotData.transfer_tax,
            holderCount: honeypotData.holder_count,
            top10HoldersPercent: honeypotData.top_10_holders_percent,
            contractVerified: honeypotData.contract_verified,
            isProxy: honeypotData.is_proxy,
            liquidityUsd: honeypotData.metadata?.liquidity_usd,
          },
          onchain: {
            isContract: onchainData.is_contract,
            isERC20: onchainData.is_erc20,
            codeSize: onchainData.code_size,
            totalSupply: onchainData.total_supply,
            decimals: onchainData.decimals,
          },
        },

        // Metadata
        meta: {
          timestamp: new Date().toISOString(),
          processingTimeMs: processingTime,
          version: "1.0.0",
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error processing request:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input parameters",
            details: error.errors,
          },
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "An unexpected error occurred",
        },
      },
      500
    );
  }
});

// ========================================
// LEGACY ENDPOINTS (for compatibility)
// ========================================

app.post("/entrypoints/check-token-safety/invoke", async (c) => {
  // Redirect to new API
  return c.redirect("/api/v1/analyze", 308);
});

app.get("/entrypoints/check-token-safety", (c) => {
  return c.json({
    message: "This endpoint has been deprecated. Please use /api/v1/analyze",
    newEndpoint: "/api/v1/analyze",
    documentation: "/.well-known/agent.json",
  });
});

// ========================================
// DOCUMENTATION & INFO ENDPOINTS
// ========================================

// Root endpoint - Human-friendly landing page
app.get("/", (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Safety Check - Lucid AI Agent</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        .subtitle { font-size: 1.2em; opacity: 0.9; margin-bottom: 30px; }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 5px 15px;
            border-radius: 20px;
            margin: 5px;
            font-size: 0.9em;
        }
        .section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .section h2 { margin-bottom: 15px; font-size: 1.5em; }
        .endpoint {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }
        .method { 
            display: inline-block;
            background: #4ade80;
            color: #000;
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 10px;
        }
        .method.post { background: #60a5fa; color: #fff; }
        a { color: #4ade80; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .chains { display: flex; flex-wrap: wrap; gap: 10px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { opacity: 0.8; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Token Safety Check</h1>
        <p class="subtitle">AI-Powered Token Security Analysis for Multi-Chain Assets</p>
        
        <div class="badges">
            <span class="badge">✨ Lucid AI Agent</span>
            <span class="badge">💰 x402 Payments</span>
            <span class="badge">🔗 Multi-Chain</span>
            <span class="badge">⚡ Real-Time</span>
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value">7</div>
                <div class="stat-label">Supported Chains</div>
            </div>
            <div class="stat">
                <div class="stat-value">2</div>
                <div class="stat-label">Data Sources</div>
            </div>
            <div class="stat">
                <div class="stat-value">$0.02</div>
                <div class="stat-label">Per Analysis</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 What We Do</h2>
            <p>Protect yourself from honeypots, scams, and risky tokens. Our AI agent analyzes tokens across multiple blockchains, checking for:</p>
            <ul style="margin: 15px 0 0 20px; line-height: 1.8;">
                <li>🍯 Honeypot detection</li>
                <li>💸 High buy/sell taxes</li>
                <li>👥 Centralization risks</li>
                <li>📝 Contract verification</li>
                <li>🔧 Technical issues</li>
            </ul>
        </div>

        <div class="section">
            <h2>🔗 Supported Blockchains</h2>
            <div class="chains">
                ${Object.values(CHAIN_NAMES).map(name => `<span class="badge">${name}</span>`).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🚀 API Endpoints</h2>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <a href="/api/v1/analyze">/api/v1/analyze</a>
                <p style="margin-top: 10px; opacity: 0.8;">Analyze token safety (main endpoint)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/.well-known/agent.json">/.well-known/agent.json</a>
                <p style="margin-top: 10px; opacity: 0.8;">Lucid agent manifest (for AI discovery)</p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <a href="/health">/health</a>
                <p style="margin-top: 10px; opacity: 0.8;">Service health check</p>
            </div>
        </div>

        <div class="section">
            <h2>📖 Quick Start</h2>
            <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto;"><code>curl -X POST ${SERVICE_URL}/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }'</code></pre>
        </div>

        <div class="section">
            <h2>💰 Payment</h2>
            <p>Powered by x402 micropayments on Base network</p>
            <p style="margin-top: 10px;">Price: <strong>$${(DEFAULT_PRICE / 1000000).toFixed(2)} USDC</strong> per token analysis</p>
        </div>

        <div class="section" style="text-align: center; padding: 30px;">
            <p style="opacity: 0.8;">Built with ❤️ for the Lucid AI ecosystem</p>
            <p style="margin-top: 10px;">
                <a href="https://github.com/DeganAI/Token-Safety-Check" target="_blank">GitHub</a> •
                <a href="/.well-known/agent.json">Agent Manifest</a> •
                <a href="/health">Status</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return c.html(html);
});

// API documentation
app.get("/docs", (c) => {
  return c.json({
    name: "Token Safety Check API",
    version: "1.0.0",
    baseUrl: SERVICE_URL,
    authentication: {
      type: "x402",
      network: NETWORK,
      pricePerRequest: `${(DEFAULT_PRICE / 1000000).toFixed(2)} USDC`,
    },
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/analyze",
        description: "Analyze token safety",
        requestBody: {
          token_address: "0x-prefixed hex address",
          chain_id: "Network ID (1, 56, 137, etc.)",
        },
        response: "Comprehensive safety analysis with score, warnings, and recommendations",
      },
      {
        method: "GET",
        path: "/.well-known/agent.json",
        description: "Lucid agent manifest for AI discovery",
      },
      {
        method: "GET",
        path: "/health",
        description: "Service health status",
      },
    ],
    supportedChains: Object.entries(CHAIN_NAMES).map(([id, name]) => ({
      chainId: parseInt(id),
      name,
    })),
  });
});

// Start server
console.log(`\n🚀 Token Safety Check - Lucid AI Agent`);
console.log(`📊 Version: 1.0.0`);
console.log(`🌐 Port: ${PORT}`);
console.log(`🔗 Chains: ${Object.values(CHAIN_NAMES).join(", ")}`);
console.log(`💰 Price: ${(DEFAULT_PRICE / 1000000).toFixed(2)} USDC per analysis`);
console.log(`🎯 Protocol: x402 on ${NETWORK}`);
console.log(`\n✅ Server running at ${SERVICE_URL}\n`);

export default {
  port: PORT,
  fetch: app.fetch,
};
