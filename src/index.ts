/**
 * Token Safety Check - x402 Agent
 * 
 * A comprehensive token safety analysis service that detects honeypots,
 * scams, and risky tokens across multiple blockchain networks.
 * 
 * Powered by x402 micropayments on Base network.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { HoneypotChecker } from "./analyzers/honeypot-checker.js";
import { OnChainAnalyzer } from "./analyzers/onchain-analyzer.js";
import { ScoringEngine } from "./analyzers/scoring-engine.js";

// Environment configuration
const PORT = process.env.PORT || 3000;
const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS || "0x01D11F7e1a46AbFC6092d7be484895D2d505095c";
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems";
const NETWORK = process.env.NETWORK || "base";
const DEFAULT_PRICE = parseInt(process.env.DEFAULT_PRICE || "20000");

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
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// x402 Agent Discovery - Well-known endpoint
app.get("/.well-known/agent.json", (c) => {
  const manifest = {
    name: "Token Safety Check",
    description: "Comprehensive token safety analysis to prevent honeypots and scams across multiple chains",
    version: "1.0.0",
    x402: {
      payment: {
        address: PAYMENT_ADDRESS,
        facilitatorUrl: FACILITATOR_URL,
        network: NETWORK,
      },
      entrypoints: [
        {
          name: "check-token-safety",
          displayName: "Check Token Safety",
          description: "Analyze a token for honeypots, high taxes, and other scam indicators",
          path: "/entrypoints/check-token-safety",
          method: "POST",
          price: DEFAULT_PRICE,
          input: {
            type: "object",
            properties: {
              token_address: {
                type: "string",
                description: "Token contract address (0x...)",
                pattern: "^0x[a-fA-F0-9]{40}$",
              },
              chain_id: {
                type: "number",
                description: "Blockchain network ID (1=Ethereum, 56=BSC, 137=Polygon, etc.)",
                enum: [1, 56, 137, 42161, 10, 8453, 43114],
              },
            },
            required: ["token_address", "chain_id"],
          },
          output: {
            type: "object",
            properties: {
              safety_score: {
                type: "number",
                description: "Overall safety score 0-100 (higher = safer)",
              },
              risk_level: {
                type: "string",
                enum: ["SAFE", "LOW_RISK", "MEDIUM_RISK", "HIGH_RISK", "CRITICAL"],
              },
              is_honeypot: {
                type: "boolean",
                description: "Whether token is confirmed honeypot",
              },
              warnings: {
                type: "array",
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      ],
      categories: ["blockchain", "security", "defi"],
      tags: ["token-analysis", "honeypot-detection", "scam-prevention", "blockchain-security"],
    },
    author: {
      name: "Token Safety Check Team",
      url: "https://github.com/yourusername/token-safety-check",
    },
    homepage: "https://github.com/yourusername/token-safety-check",
    repository: "https://github.com/yourusername/token-safety-check",
  };

  return c.json(manifest);
});

// Main entrypoint - Token safety check
app.post("/entrypoints/check-token-safety/invoke", async (c) => {
  try {
    // Parse and validate input
    const body = await c.req.json();
    const input = TokenCheckSchema.parse(body);

    console.log(`\n🔍 Analyzing token ${input.token_address} on chain ${input.chain_id}...`);

    // Check if chain is supported
    if (!onchainAnalyzer.isChainSupported(input.chain_id)) {
      return c.json(
        {
          error: "Unsupported chain",
          message: `Chain ID ${input.chain_id} is not supported. Supported chains: ${onchainAnalyzer.getSupportedChains().join(", ")}`,
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

    // Log summary
    console.log(`✅ Analysis complete:`);
    console.log(`   Safety Score: ${result.safety_score}/100`);
    console.log(`   Risk Level: ${result.risk_level}`);
    console.log(`   Is Honeypot: ${result.is_honeypot}`);
    console.log(`   Warnings: ${result.warnings.length}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);

    // Return comprehensive result
    return c.json({
      success: true,
      data: {
        token_address: input.token_address,
        chain_id: input.chain_id,
        chain_name: CHAIN_NAMES[input.chain_id] || "Unknown",
        analysis: {
          safety_score: result.safety_score,
          risk_level: result.risk_level,
          is_honeypot: result.is_honeypot,
          confidence: result.confidence,
          warnings: result.warnings,
          recommendations: result.recommendations,
          metadata: result.metadata,
          sources_checked: result.sources_checked,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error processing request:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Validation error",
          message: "Invalid input parameters",
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        error: "Internal server error",
        message: error.message || "An unexpected error occurred",
      },
      500
    );
  }
});

// Entrypoint discovery (returns schema)
app.get("/entrypoints/check-token-safety", (c) => {
  return c.json({
    name: "check-token-safety",
    displayName: "Check Token Safety",
    description: "Analyze a token for honeypots, high taxes, and other scam indicators",
    method: "POST",
    path: "/entrypoints/check-token-safety/invoke",
    price: DEFAULT_PRICE,
    input_schema: {
      type: "object",
      properties: {
        token_address: {
          type: "string",
          description: "Token contract address (0x...)",
          pattern: "^0x[a-fA-F0-9]{40}$",
        },
        chain_id: {
          type: "number",
          description: "Blockchain network ID",
          enum: [1, 56, 137, 42161, 10, 8453, 43114],
        },
      },
      required: ["token_address", "chain_id"],
    },
    example_input: {
      token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      chain_id: 1,
    },
  });
});

// Root endpoint
app.get("/", (c) => {
  return c.json({
    service: "Token Safety Check",
    version: "1.0.0",
    description: "Comprehensive token safety analysis powered by x402",
    endpoints: {
      health: "/health",
      manifest: "/.well-known/agent.json",
      entrypoint: "/entrypoints/check-token-safety/invoke",
    },
    supported_chains: Object.entries(CHAIN_NAMES).map(([id, name]) => ({
      id: parseInt(id),
      name,
    })),
    payment: {
      network: NETWORK,
      price_usdc: (DEFAULT_PRICE / 1000000).toFixed(2),
    },
  });
});

// Start server
console.log(`\n🚀 Token Safety Check starting on port ${PORT}...`);
console.log(`📊 Supported chains: ${Object.values(CHAIN_NAMES).join(", ")}`);
console.log(`💰 Payment: ${(DEFAULT_PRICE / 1000000).toFixed(2)} USDC via x402 on ${NETWORK}`);
console.log(`\n✅ Server running at http://localhost:${PORT}\n`);

export default {
  port: PORT,
  fetch: app.fetch,
};
