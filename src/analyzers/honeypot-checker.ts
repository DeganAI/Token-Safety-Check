/**
 * Honeypot Detection via Honeypot.is API
 * 
 * This module provides comprehensive honeypot detection by querying the honeypot.is API.
 * It analyzes tokens for scam characteristics including:
 * - Buy/sell/transfer taxes
 * - Holder concentration
 * - Contract verification status
 * - Proxy patterns
 * - Honeypot simulation results
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Comprehensive error handling
 * - Detailed logging
 * - Graceful degradation
 */

/**
 * Result structure from honeypot analysis
 */
export interface HoneypotCheckResult {
  /** Data source identifier */
  source: string;
  /** Risk level: very_low, low, medium, high, very_high, honeypot, unknown */
  risk_level: string;
  /** Numerical risk score 0-100 (higher = more dangerous) */
  risk_score: number;
  /** Whether token is confirmed honeypot */
  is_honeypot: boolean | null;
  /** Buy tax percentage (0-100) */
  buy_tax: number | null;
  /** Sell tax percentage (0-100) */
  sell_tax: number | null;
  /** Transfer tax percentage (0-100) */
  transfer_tax: number | null;
  /** Gas used for buy transaction */
  buy_gas_used: number | null;
  /** Gas used for sell transaction */
  sell_gas_used: number | null;
  /** Total number of token holders */
  holder_count: number | null;
  /** Percentage owned by top 10 holders */
  top_10_holders_percent: number | null;
  /** Whether contract source code is verified */
  contract_verified: boolean | null;
  /** Whether contract uses proxy pattern */
  is_proxy: boolean | null;
  /** Explanation if honeypot detected */
  honeypot_reason: string;
  /** Additional metadata */
  metadata?: {
    /** Token name if available */
    token_name?: string;
    /** Token symbol if available */
    token_symbol?: string;
    /** Liquidity amount in USD */
    liquidity_usd?: number;
    /** Whether liquidity is locked */
    liquidity_locked?: boolean;
    /** Creation timestamp */
    created_at?: string;
  };
  /** Raw API response for debugging */
  raw_data: Record<string, any>;
  /** Error message if check failed */
  error?: string;
}

/**
 * Configuration options for HoneypotChecker
 */
export interface HoneypotCheckerOptions {
  /** Base URL for honeypot.is API */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelay?: number;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

/**
 * HoneypotChecker - Detects scam tokens via honeypot.is API
 * 
 * Usage:
 * ```typescript
 * const checker = new HoneypotChecker({ verbose: true });
 * const result = await checker.checkToken("0x...", 1);
 * 
 * if (result.is_honeypot) {
 *   console.log("HONEYPOT DETECTED:", result.honeypot_reason);
 * }
 * ```
 */
export class HoneypotChecker {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly verbose: boolean;

  constructor(options: HoneypotCheckerOptions = {}) {
    this.baseUrl = options.baseUrl || "https://api.honeypot.is/v2/IsHoneypot";
    this.timeout = options.timeout || 10000;
    this.maxRetries = options.maxRetries || 2;
    this.retryDelay = options.retryDelay || 1000;
    this.verbose = options.verbose || false;
  }

  /**
   * Check if a token is a honeypot
   * 
   * @param tokenAddress - Token contract address (with or without 0x prefix)
   * @param chainId - Blockchain network ID
   * @returns Promise resolving to honeypot check result
   * 
   * @example
   * ```typescript
   * const result = await checker.checkToken(
   *   "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
   *   1
   * );
   * console.log(`Safety Score: ${100 - result.risk_score}`);
   * ```
   */
  async checkToken(tokenAddress: string, chainId: number): Promise<HoneypotCheckResult> {
    // Normalize address
    const normalizedAddress = this.normalizeAddress(tokenAddress);
    
    this.log(`Checking token ${normalizedAddress} on chain ${chainId}`);

    // Attempt request with retries
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.makeRequest(normalizedAddress, chainId);
        this.log(`Successfully analyzed token (attempt ${attempt + 1})`);
        return result;
      } catch (error: any) {
        const isLastAttempt = attempt === this.maxRetries;
        
        if (isLastAttempt) {
          console.error(`Honeypot API failed after ${this.maxRetries + 1} attempts:`, error.message);
          return this.errorResponse(`Failed after ${this.maxRetries + 1} attempts: ${error.message}`);
        }

        // Calculate exponential backoff delay
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // Should never reach here due to logic above, but TypeScript needs it
    return this.errorResponse("Unexpected error in retry logic");
  }

  /**
   * Make HTTP request to honeypot.is API
   */
  private async makeRequest(address: string, chainId: number): Promise<HoneypotCheckResult> {
    const params = new URLSearchParams({
      address,
      chainID: String(chainId),
    });

    const url = `${this.baseUrl}?${params}`;
    this.log(`Requesting: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TokenSafetyCheck/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return this.parseResponse(data, address, chainId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Parse API response into structured result
   */
  private parseResponse(
    data: Record<string, any>,
    address: string,
    chainId: number
  ): HoneypotCheckResult {
    try {
      // Extract nested data structures
      const summary = data.summary || {};
      const honeypotResult = data.honeypotResult || {};
      const simulation = data.simulationResult || {};
      const holderAnalysis = data.holderAnalysis || {};
      const contractCode = data.contractCode || {};
      const token = data.token || {};
      const pair = data.pair || {};

      // Calculate risk score
      const risk = summary.risk || "unknown";
      const riskScore = this.riskToScore(risk);

      // Extract tax information (handle both percentage and decimal formats)
      const buyTax = this.parseTax(simulation.buyTax);
      const sellTax = this.parseTax(simulation.sellTax);
      const transferTax = this.parseTax(simulation.transferTax);

      // Build result
      const result: HoneypotCheckResult = {
        source: "honeypot.is",
        risk_level: risk,
        risk_score: riskScore,
        is_honeypot: Boolean(honeypotResult.isHoneypot),
        buy_tax: buyTax,
        sell_tax: sellTax,
        transfer_tax: transferTax,
        buy_gas_used: this.parseNumber(simulation.buyGas),
        sell_gas_used: this.parseNumber(simulation.sellGas),
        holder_count: this.parseNumber(holderAnalysis.holders),
        top_10_holders_percent: this.parseFloat(holderAnalysis.top10Percent),
        contract_verified: Boolean(contractCode.openSource),
        is_proxy: Boolean(contractCode.isProxy),
        honeypot_reason: String(honeypotResult.honeypotReason || ""),
        metadata: {
          token_name: token.name || undefined,
          token_symbol: token.symbol || undefined,
          liquidity_usd: this.parseFloat(pair?.liquidity?.usd),
          liquidity_locked: Boolean(pair?.liquidity?.locked),
          created_at: token.createdAt || undefined,
        },
        raw_data: data,
      };

      // Add detailed logging in verbose mode
      if (this.verbose) {
        this.log("Parsed honeypot data:", {
          address,
          chainId,
          risk_level: result.risk_level,
          is_honeypot: result.is_honeypot,
          buy_tax: result.buy_tax,
          sell_tax: result.sell_tax,
          holders: result.holder_count,
        });
      }

      return result;
    } catch (error: any) {
      console.error(`Error parsing honeypot.is response: ${error.message}`);
      console.error("Raw data:", JSON.stringify(data, null, 2).slice(0, 500));
      return this.errorResponse(`Parse error: ${error.message}`);
    }
  }

  /**
   * Convert risk level string to numerical score (0-100, higher = more dangerous)
   */
  private riskToScore(risk: string): number {
    const riskMapping: Record<string, number> = {
      very_low: 5,
      low: 20,
      medium: 50,
      high: 75,
      very_high: 90,
      honeypot: 100,
      unknown: 50,
    };
    
    const normalizedRisk = risk.toLowerCase().replace(/\s+/g, "_");
    return riskMapping[normalizedRisk] ?? 50;
  }

  /**
   * Parse tax value - handles both percentage (0-100) and decimal (0-1) formats
   */
  private parseTax(value: any): number | null {
    if (value === null || value === undefined) return null;
    
    const num = Number(value);
    if (isNaN(num)) return null;
    
    // If value is between 0 and 1, assume it's decimal format (convert to percentage)
    // If value is > 1, assume it's already percentage
    return num < 1 ? num * 100 : num;
  }

  /**
   * Parse number safely, returning null if invalid
   */
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse float safely, returning null if invalid
   */
  private parseFloat(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  /**
   * Normalize Ethereum address format
   */
  private normalizeAddress(address: string): string {
    // Remove 0x prefix if present
    const cleaned = address.toLowerCase().replace(/^0x/i, "");
    
    // Validate hex format
    if (!/^[a-f0-9]{40}$/i.test(cleaned)) {
      console.warn(`Invalid address format: ${address}`);
    }
    
    return `0x${cleaned}`;
  }

  /**
   * Create error response with default values
   */
  private errorResponse(error: string): HoneypotCheckResult {
    return {
      source: "honeypot.is",
      risk_level: "unknown",
      risk_score: 50,
      is_honeypot: null,
      error,
      buy_tax: null,
      sell_tax: null,
      transfer_tax: null,
      buy_gas_used: null,
      sell_gas_used: null,
      holder_count: null,
      top_10_holders_percent: null,
      contract_verified: null,
      is_proxy: null,
      honeypot_reason: "",
      metadata: {},
      raw_data: {},
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Conditional logging based on verbose flag
   */
  private log(message: string, data?: any): void {
    if (this.verbose) {
      if (data) {
        console.log(`[HoneypotChecker] ${message}`, data);
      } else {
        console.log(`[HoneypotChecker] ${message}`);
      }
    }
  }
}
