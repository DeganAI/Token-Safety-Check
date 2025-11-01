# Token Safety Check - Usage Examples

## Quick Start Examples

### 1. Check a Safe Token (USDC)

```bash
curl -X POST https://your-domain.com/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -H "X-Payment: YOUR_PAYMENT_TOKEN" \
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }'
```

**Expected Response:**
```json
{
  "run_id": "uuid-here",
  "status": "completed",
  "output": {
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1,
    "safety_score": 90,
    "risk_level": "SAFE",
    "is_honeypot": false,
    "confidence": 0.9,
    "warnings": [],
    "recommendations": [
      "✅ Generally safe to interact",
      "Always verify contract on blockchain explorer"
    ],
    "sources_checked": ["honeypot.is", "onchain"]
  }
}
```

### 2. Check Token on BSC

```bash
curl -X POST https://your-domain.com/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -H "X-Payment: YOUR_PAYMENT_TOKEN" \
  -d '{
    "token_address": "0x55d398326f99059fF775485246999027B3197955",
    "chain_id": 56
  }'
```

### 3. Check Token on Polygon

```bash
curl -X POST https://your-domain.com/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -H "X-Payment: YOUR_PAYMENT_TOKEN" \
  -d '{
    "token_address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "chain_id": 137
  }'
```

## Integration Examples

### JavaScript/TypeScript

```typescript
import { createX402Fetch } from "@lucid-dreams/agent-kit/utils";

// Initialize x402-enabled fetch
const fetchWithPayment = createX402Fetch({
  account: yourAccount,
  fetchImpl: fetch
});

// Analyze token
async function checkTokenSafety(tokenAddress: string, chainId: number) {
  const response = await fetchWithPayment(
    "https://your-domain.com/entrypoints/check-token-safety/invoke",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token_address: tokenAddress,
        chain_id: chainId
      })
    }
  );
  
  const data = await response.json();
  return data.output;
}

// Usage
const result = await checkTokenSafety(
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  1
);

console.log(`Safety Score: ${result.safety_score}`);
console.log(`Risk Level: ${result.risk_level}`);
console.log(`Is Honeypot: ${result.is_honeypot}`);
```

### Python

```python
import requests
import json

def check_token_safety(token_address: str, chain_id: int, payment_token: str):
    """Check token safety via Token Safety Check agent"""
    
    url = "https://your-domain.com/entrypoints/check-token-safety/invoke"
    
    headers = {
        "Content-Type": "application/json",
        "X-Payment": payment_token
    }
    
    payload = {
        "token_address": token_address,
        "chain_id": chain_id
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    return response.json()["output"]

# Usage
result = check_token_safety(
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    1,
    "your-payment-token"
)

print(f"Safety Score: {result['safety_score']}")
print(f"Risk Level: {result['risk_level']}")
print(f"Warnings: {', '.join(result['warnings'])}")
```

### Node.js (Simple)

```javascript
const fetch = require('node-fetch');

async function checkToken(tokenAddress, chainId, paymentToken) {
  const response = await fetch(
    'https://your-domain.com/entrypoints/check-token-safety/invoke',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': paymentToken
      },
      body: JSON.stringify({
        token_address: tokenAddress,
        chain_id: chainId
      })
    }
  );
  
  const data = await response.json();
  return data.output;
}

// Usage
checkToken(
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  1,
  'your-payment-token'
).then(result => {
  console.log('Safety Score:', result.safety_score);
  console.log('Risk Level:', result.risk_level);
  console.log('Is Honeypot:', result.is_honeypot);
});
```

## Use Case Examples

### 1. Pre-Trade Safety Check

Before allowing a user to trade a token:

```typescript
async function canTradeToken(tokenAddress: string, chainId: number): Promise<boolean> {
  const safety = await checkTokenSafety(tokenAddress, chainId);
  
  // Block honeypots
  if (safety.is_honeypot) {
    console.error("⚠️ HONEYPOT DETECTED - Trade blocked");
    return false;
  }
  
  // Warn on high risk
  if (safety.risk_level === "HIGH_RISK" || safety.risk_level === "CRITICAL") {
    console.warn("⚠️ High risk token detected");
    console.warn("Warnings:", safety.warnings);
    // Require user confirmation for high-risk tokens
    return await getUserConfirmation(safety.warnings);
  }
  
  return true;
}
```

### 2. Portfolio Risk Assessment

Check all tokens in a user's portfolio:

```typescript
async function assessPortfolioRisk(tokens: Array<{address: string, chain: number}>) {
  const results = await Promise.all(
    tokens.map(token => checkTokenSafety(token.address, token.chain))
  );
  
  const riskyTokens = results.filter(r => 
    r.risk_level === "HIGH_RISK" || r.risk_level === "CRITICAL"
  );
  
  const honeypots = results.filter(r => r.is_honeypot);
  
  return {
    totalTokens: tokens.length,
    riskyTokens: riskyTokens.length,
    honeypots: honeypots.length,
    averageSafetyScore: results.reduce((sum, r) => sum + r.safety_score, 0) / results.length,
    tokens: results
  };
}
```

### 3. Token Watchlist Monitor

Monitor tokens and alert on risk changes:

```typescript
class TokenWatchlist {
  private tokens: Map<string, any> = new Map();
  
  async addToken(address: string, chainId: number) {
    const safety = await checkTokenSafety(address, chainId);
    this.tokens.set(`${address}-${chainId}`, {
      address,
      chainId,
      lastCheck: new Date(),
      lastSafetyScore: safety.safety_score,
      lastRiskLevel: safety.risk_level
    });
  }
  
  async checkAll(): Promise<Array<{address: string, riskChange: string}>> {
    const alerts = [];
    
    for (const [key, token] of this.tokens.entries()) {
      const safety = await checkTokenSafety(token.address, token.chainId);
      
      // Alert if risk increased
      if (this.riskLevelValue(safety.risk_level) > this.riskLevelValue(token.lastRiskLevel)) {
        alerts.push({
          address: token.address,
          chainId: token.chainId,
          riskChange: `${token.lastRiskLevel} → ${safety.risk_level}`,
          warnings: safety.warnings
        });
      }
      
      // Update stored values
      token.lastCheck = new Date();
      token.lastSafetyScore = safety.safety_score;
      token.lastRiskLevel = safety.risk_level;
    }
    
    return alerts;
  }
  
  private riskLevelValue(level: string): number {
    const values = { SAFE: 0, LOW_RISK: 1, MEDIUM_RISK: 2, HIGH_RISK: 3, CRITICAL: 4 };
    return values[level] ?? 2;
  }
}
```

### 4. DEX Integration

Integrate into a DEX frontend:

```typescript
// In your swap component
async function validateSwap(tokenIn: string, tokenOut: string, chainId: number) {
  // Check both tokens in parallel
  const [safetyIn, safetyOut] = await Promise.all([
    checkTokenSafety(tokenIn, chainId),
    checkTokenSafety(tokenOut, chainId)
  ]);
  
  // Block if either is a honeypot
  if (safetyIn.is_honeypot || safetyOut.is_honeypot) {
    throw new Error("Cannot swap: Honeypot token detected");
  }
  
  // Show warnings for risky tokens
  const warnings = [...safetyIn.warnings, ...safetyOut.warnings];
  if (warnings.length > 0) {
    return {
      canProceed: true,
      requiresConfirmation: true,
      warnings
    };
  }
  
  return { canProceed: true, requiresConfirmation: false };
}
```

### 5. Bot Protection

Protect trading bots from scam tokens:

```typescript
class SafeTradingBot {
  private minSafetyScore = 70;
  private blockedTokens = new Set<string>();
  
  async executeTrade(tokenAddress: string, chainId: number, amount: number) {
    // Check if previously blocked
    const key = `${tokenAddress}-${chainId}`;
    if (this.blockedTokens.has(key)) {
      console.log("Token in blocklist, skipping");
      return false;
    }
    
    // Safety check
    const safety = await checkTokenSafety(tokenAddress, chainId);
    
    // Block honeypots permanently
    if (safety.is_honeypot) {
      this.blockedTokens.add(key);
      console.error("Honeypot detected, added to blocklist");
      return false;
    }
    
    // Skip low safety score
    if (safety.safety_score < this.minSafetyScore) {
      console.warn(`Safety score ${safety.safety_score} below threshold ${this.minSafetyScore}`);
      return false;
    }
    
    // Proceed with trade
    return await this.executeTradeInternal(tokenAddress, amount);
  }
}
```

## Response Interpretation Guide

### Safety Score Ranges

```typescript
function interpretSafetyScore(score: number): string {
  if (score >= 80) return "✅ Safe to interact";
  if (score >= 60) return "⚠️ Exercise caution";
  if (score >= 40) return "⚠️ High risk";
  if (score >= 20) return "🚫 Very high risk";
  return "🚫 Critical - avoid interaction";
}
```

### Risk Level Actions

```typescript
function getRecommendedAction(riskLevel: string): string {
  switch (riskLevel) {
    case "SAFE":
      return "Proceed with normal caution";
    case "LOW_RISK":
      return "Start with small test transaction";
    case "MEDIUM_RISK":
      return "Exercise extreme caution, verify all details";
    case "HIGH_RISK":
      return "Only proceed if you fully understand the risks";
    case "CRITICAL":
      return "Do not interact - high probability of scam";
    default:
      return "Unable to assess - proceed with extreme caution";
  }
}
```

### Warning Analysis

```typescript
function analyzeWarnings(warnings: string[]): {
  hasHighTax: boolean;
  isCentralized: boolean;
  isUnverified: boolean;
  isProxy: boolean;
} {
  return {
    hasHighTax: warnings.some(w => w.includes("tax")),
    isCentralized: warnings.some(w => w.includes("holders own")),
    isUnverified: warnings.some(w => w.includes("not verified")),
    isProxy: warnings.some(w => w.includes("Proxy"))
  };
}
```

## Testing Without Payment

For development/testing, you can run the service locally without x402 enforcement:

```bash
# Start local server
bun run dev

# Test without payment header (local only)
curl -X POST http://localhost:3000/entrypoints/check-token-safety/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1
  }'
```

## Rate Limiting

When integrating, be mindful of:
- API rate limits (if implemented)
- RPC provider limits
- Cost per check (0.02 USDC)

Consider caching results for tokens you check frequently.

## Error Handling

```typescript
async function safeCheckToken(address: string, chainId: number) {
  try {
    const result = await checkTokenSafety(address, chainId);
    return { success: true, data: result };
  } catch (error) {
    if (error.status === 402) {
      return { success: false, error: "Payment required" };
    }
    if (error.status === 400) {
      return { success: false, error: "Invalid input" };
    }
    return { success: false, error: "Service unavailable" };
  }
}
```

## Best Practices

1. **Cache Results**: Store results for 5-10 minutes to reduce costs
2. **Batch Requests**: If checking multiple tokens, use Promise.all
3. **Handle Errors**: Always implement proper error handling
4. **User Warnings**: Display warnings prominently to users
5. **Don't Block Safe Tokens**: Use appropriate thresholds for your use case
6. **Log Decisions**: Track why trades were blocked for analysis

## Support

For more examples or integration help:
- GitHub: https://github.com/yourusername/token-safety-check
- Issues: https://github.com/yourusername/token-safety-check/issues
- Daydreams Discord: https://discord.gg/daydreams
