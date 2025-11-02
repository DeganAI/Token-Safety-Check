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
              des
