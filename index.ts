/**
 * Token Safety Check - Daydreams x402 Agent
 * 
 * Comprehensive token safety analysis to prevent honeypots and scams
 */
import { z } from "zod";
import { createAgentApp } from "@lucid-dreams/agent-kit";
import type { EntrypointDef } from "@lucid-dreams/agent-kit/types";
import { HoneypotChecker } from "./analyzers/honeypot-checker.js";
import { OnChainAnalyzer } from "./analyzers/onchain-analyzer.js";
import { ScoringEngine } from "./analyzers/scoring-engine.js";

// Supported blockchain chains
const SUPPORTED_CHAINS = {
  1: "Ethereum",
  56: "BSC",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
  43114: "Avalanche",
} as const;

// Initialize analyzers
const honeypotChecker = new HoneypotChecker();
const scoringEngine = new ScoringEngine();

// Initialize on-chain analyzer with RPC URLs from environment
const rpcUrls: Record<number, string> = {};
const RPC_ENV_MAP: Record<number, string> = {
  1: "ETHEREUM_RPC_URL",
  56: "BSC_RPC_URL",
  137: "POLYGON_RPC_URL",
  42161: "ARBITRUM_RPC_URL",
  10: "OPTIMISM_RPC_URL",
  8453: "BASE_RPC_URL",
  43114: "AVALANCHE_RPC_URL",
};

for (const [chainId, envVar] of Object.entries(RPC_ENV_MAP)) {
  const rpcUrl = process.env[envVar];
  if (rpcUrl) {
    rpcUrls[Number(chainId)] = rpcUrl;
  }
}

const onchainAnalyzer = new OnChainAnalyzer(rpcUrls);
console.log(`✓ On-chain analyzer initialized with ${Object.keys(rpcUrls).length} chains`);

// Input/Output schemas
const SafetyCheckInput = z.object({
  token_address: z.string().describe("Token contract address to analyze"),
  chain_id: z.number().int().positive().describe("Blockchain ID (1=Ethereum, 56=BSC, 137=Polygon, etc.)"),
});

const SafetyCheckOutput = z.object({
  token_address: z.string(),
  chain_id: z.number(),
  safety_score: z.number().int().min(0).max(100).describe("Overall safety score (0-100, higher=safer)"),
  risk_level: z.enum(["SAFE", "LOW_RISK", "MEDIUM_RISK", "HIGH_RISK", "CRITICAL"]),
  is_honeypot: z.boolean(),
  confidence: z.number().min(0).max(1).describe("Analysis confidence (0.0-1.0)"),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  details: z.object({
    honeypot: z.record(z.any()),
    onchain: z.record(z.any()),
  }),
  sources_checked: z.array(z.string()),
  timestamp: z.string(),
});

// Create agent app
const { app, addEntrypoint } = createAgentApp(
  {
    name: "Token Safety Check",
    version: "1.0.0",
    description: "Comprehensive token safety analysis to prevent honeypots and scams. Checks multiple sources including honeypot detection, contract verification, and on-chain analysis.",
  },
  {
    // Enable x402 payments with default price
    useConfigPayments: true,
    config: {
      payments: {
        defaultPrice: "20000", // 0.02 USDC (6 decimals)
        network: "base",
        payTo: process.env.PAYMENT_ADDRESS || "0x01D11F7e1a46AbFC6092d7be484895D2d505095c",
      },
    },
    // Add AP2 extension for Agent Payments Protocol
    ap2: {
      roles: ["merchant"],
      required: true,
    },
  }
);

// Define the main entrypoint
const tokenSafetyEntrypoint: EntrypointDef = {
  key: "check-token-safety",
  description: "Analyze token safety to detect honeypots, scams, and risks across multiple data sources",
  input: SafetyCheckInput,
  output: SafetyCheckOutput,
  streaming: false,
  price: "20000", // 0.02 USDC per check
  
  async handler({ input }) {
    const { token_address, chain_id } = input;

    // Validate chain support
    if (!(chain_id in SUPPORTED_CHAINS)) {
      throw new Error(
        `Chain ${chain_id} not supported. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(", ")}`
      );
    }

    console.log(`Analyzing token ${token_address} on chain ${chain_id} (${SUPPORTED_CHAINS[chain_id as keyof typeof SUPPORTED_CHAINS]})`);

    // Run analyzers in parallel
    const [honeypotData, onchainData] = await Promise.all([
      honeypotChecker.checkToken(token_address, chain_id),
      onchainAnalyzer.analyzeToken(token_address, chain_id),
    ]);

    // Aggregate results
    const result = scoringEngine.aggregateResults(honeypotData, onchainData);

    // Build output
    const output = {
      token_address,
      chain_id,
      safety_score: result.safety_score,
      risk_level: result.risk_level,
      is_honeypot: result.is_honeypot,
      confidence: result.confidence,
      warnings: result.warnings,
      recommendations: result.recommendations,
      details: result.raw_data,
      sources_checked: result.sources_checked,
      timestamp: new Date().toISOString(),
    };

    console.log(`✓ Analysis complete: ${result.risk_level} (score: ${result.safety_score})`);

    return {
      output,
      usage: {
        total_tokens: 1, // Simple usage tracking
      },
    };
  },
};

// Register entrypoint
addEntrypoint(tokenSafetyEntrypoint);

// Add custom route for legacy API compatibility (optional)
app.get("/", (c) => {
  return c.json({
    service: "Token Safety Check",
    description: "Comprehensive token safety analysis to prevent honeypots and scams",
    version: "1.0.0",
    endpoints: {
      analyze: "/entrypoints/check-token-safety/invoke",
      health: "/health",
      manifest: "/.well-known/agent.json",
    },
    features: [
      "Honeypot detection",
      "Contract verification check",
      "Tax analysis (buy/sell/transfer)",
      "Holder concentration analysis",
      "On-chain validation",
      "Multi-source aggregation",
      "Confidence scoring",
    ],
    supported_chains: Object.entries(SUPPORTED_CHAINS).map(([id, name]) => ({
      chain_id: Number(id),
      name,
    })),
    payment: {
      protocol: "x402",
      network: "base",
      price: "0.02 USDC per check",
    },
  });
});

// Export for deployment
export default app;

// Start server if run directly
if (import.meta.main) {
  const port = Number(process.env.PORT || 3000);
  
  console.log(`\n🚀 Token Safety Check starting on port ${port}...`);
  console.log(`📊 Supported chains: ${Object.values(SUPPORTED_CHAINS).join(", ")}`);
  console.log(`💰 Payment: 0.02 USDC via x402 on Base\n`);
  
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`📖 API docs: http://localhost:${port}/.well-known/agent.json`);
  console.log(`❤️  Health check: http://localhost:${port}/health\n`);
}
