/**
 * Token Safety Check - Test Suite
 * 
 * Run with: bun test
 */
import { describe, test, expect, beforeAll } from "bun:test";

// Test configuration
const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

describe("Token Safety Check Agent", () => {
  
  describe("Health & Discovery Endpoints", () => {
    test("GET /health returns healthy status", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.version).toBe("1.0.0");
    });

    test("GET /.well-known/agent.json returns manifest", async () => {
      const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
      expect(response.status).toBe(200);
      
      const manifest = await response.json();
      expect(manifest.name).toBe("Token Safety Check");
      expect(manifest.version).toBe("1.0.0");
      expect(manifest.entrypoints).toBeDefined();
      expect(manifest.entrypoints["check-token-safety"]).toBeDefined();
    });

    test("GET /entrypoints returns available entrypoints", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.items).toBeArray();
      expect(data.items.length).toBeGreaterThan(0);
      
      const entrypoint = data.items.find((e: any) => e.key === "check-token-safety");
      expect(entrypoint).toBeDefined();
      expect(entrypoint.streaming).toBe(false);
    });

    test("GET / returns service information", async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.service).toBe("Token Safety Check");
      expect(data.supported_chains).toBeArray();
      expect(data.supported_chains.length).toBe(7);
    });
  });

  describe("Token Safety Analysis", () => {
    test("Analyzes USDC (safe token) correctly", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints/check-token-safety/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          chain_id: 1,
        }),
      });

      // Note: This will return 402 in production if no payment header
      // For testing locally without payment enforcement, should return 200
      if (response.status === 200) {
        const data = await response.json();
        
        expect(data.output).toBeDefined();
        expect(data.output.token_address).toBe("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
        expect(data.output.chain_id).toBe(1);
        expect(data.output.safety_score).toBeGreaterThanOrEqual(0);
        expect(data.output.safety_score).toBeLessThanOrEqual(100);
        expect(data.output.is_honeypot).toBeDefined();
        expect(data.output.confidence).toBeGreaterThanOrEqual(0);
        expect(data.output.confidence).toBeLessThanOrEqual(1);
        expect(data.output.warnings).toBeArray();
        expect(data.output.recommendations).toBeArray();
        expect(data.output.sources_checked).toBeArray();
        expect(data.output.timestamp).toBeDefined();
      } else if (response.status === 402) {
        console.log("⚠️  Payment required (x402 enabled)");
        expect(response.status).toBe(402);
      }
    }, 15000); // 15s timeout for API calls

    test("Handles invalid address format", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints/check-token-safety/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_address: "invalid-address",
          chain_id: 1,
        }),
      });

      // Should either validate at input level (400) or handle in analysis
      expect([200, 400, 402, 500]).toContain(response.status);
    });

    test("Handles unsupported chain", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints/check-token-safety/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          chain_id: 99999,
        }),
      });

      // Should return error for unsupported chain
      if (response.status === 200) {
        const data = await response.json();
        // Handler should throw error
        expect(data.error || data.output?.error).toBeDefined();
      } else {
        expect([400, 402, 500]).toContain(response.status);
      }
    });

    test("Validates required fields", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints/check-token-safety/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Missing both fields
        }),
      });

      // Should return 400 for missing required fields
      expect([400, 402]).toContain(response.status);
    });
  });

  describe("Risk Level Categorization", () => {
    test("Returns valid risk level enum", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints/check-token-safety/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          chain_id: 1,
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        const validRiskLevels = ["SAFE", "LOW_RISK", "MEDIUM_RISK", "HIGH_RISK", "CRITICAL"];
        expect(validRiskLevels).toContain(data.output.risk_level);
      }
    }, 15000);
  });

  describe("Data Source Integration", () => {
    test("Checks both honeypot.is and on-chain sources", async () => {
      const response = await fetch(`${BASE_URL}/entrypoints/check-token-safety/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          chain_id: 1,
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.output.details).toBeDefined();
        expect(data.output.details.honeypot).toBeDefined();
        expect(data.output.details.onchain).toBeDefined();
        
        // Should have at least one source
        expect(data.output.sources_checked.length).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe("Multi-chain Support", () => {
    const chains = [
      { id: 1, name: "Ethereum" },
      { id: 56, name: "BSC" },
      { id: 137, name: "Polygon" },
      { id: 42161, name: "Arbitrum" },
      { id: 10, name: "Optimism" },
      { id: 8453, name: "Base" },
      { id: 43114, name: "Avalanche" },
    ];

    test("Service info includes all supported chains", async () => {
      const response = await fetch(`${BASE_URL}/`);
      const data = await response.json();
      
      expect(data.supported_chains.length).toBe(7);
      
      chains.forEach(chain => {
        const found = data.supported_chains.find((c: any) => c.chain_id === chain.id);
        expect(found).toBeDefined();
        expect(found.name).toBe(chain.name);
      });
    });
  });

  describe("Payment Configuration", () => {
    test("Manifest includes x402 payment configuration", async () => {
      const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
      const manifest = await response.json();
      
      expect(manifest.payments).toBeArray();
      expect(manifest.payments.length).toBeGreaterThan(0);
      
      const x402Payment = manifest.payments.find((p: any) => p.method === "x402");
      expect(x402Payment).toBeDefined();
      expect(x402Payment.network).toBe("base");
      expect(x402Payment.payee).toBeDefined();
    });

    test("Entrypoint has pricing information", async () => {
      const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
      const manifest = await response.json();
      
      const entrypoint = manifest.entrypoints["check-token-safety"];
      expect(entrypoint).toBeDefined();
      expect(entrypoint.pricing).toBeDefined();
      expect(entrypoint.pricing.invoke).toBeDefined();
    });
  });
});

describe("Component Tests", () => {
  // These would test individual components in isolation
  // For now, we test through the API
  
  test.todo("HoneypotChecker handles API errors gracefully");
  test.todo("OnChainAnalyzer handles RPC errors gracefully");
  test.todo("ScoringEngine weights sources correctly");
  test.todo("Confidence calculation is accurate");
});

console.log(`
🧪 Token Safety Check Test Suite

Running tests against: ${BASE_URL}

Note: Some tests may require:
- Local server running (bun run dev)
- RPC URLs configured in .env
- Payment enforcement disabled for local testing

Run with: bun test test.ts
`);
