/**
 * Token Safety Scoring Engine - Aggregates multiple data sources
 * 
 * This module combines results from multiple analyzers into a unified safety assessment:
 * - Weighted scoring (60% honeypot.is + 40% on-chain)
 * - Risk level categorization (SAFE to CRITICAL)
 * - Confidence calculation based on data quality
 * - Warning generation with specific risk flags
 * - Recommendation synthesis with actionable advice
 * 
 * Features:
 * - Intelligent score aggregation
 * - Graceful degradation when sources fail
 * - Context-aware recommendations
 * - Comprehensive risk analysis
 */

/**
 * Comprehensive safety analysis result
 */
export interface SafetyResult {
  /** Overall safety score 0-100 (higher = safer) */
  safety_score: number;
  /** Categorical risk level */
  risk_level: "SAFE" | "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "CRITICAL";
  /** Whether token is confirmed honeypot */
  is_honeypot: boolean;
  /** Confidence in analysis 0.0-1.0 */
  confidence: number;
  /** Specific risk warnings */
  warnings: string[];
  /** Actionable recommendations */
  recommendations: string[];
  /** Data sources that provided results */
  sources_checked: string[];
  /** Raw data from all sources */
  raw_data: {
    honeypot: Record<string, any>;
    onchain: Record<string, any>;
  };
  /** Additional analysis metadata */
  metadata?: {
    /** Tax risk level */
    tax_risk?: "none" | "low" | "medium" | "high" | "critical";
    /** Centralization risk level */
    centralization_risk?: "none" | "low" | "medium" | "high" | "critical";
    /** Technical risk level */
    technical_risk?: "none" | "low" | "medium" | "high" | "critical";
    /** Number of red flags found */
    red_flags_count?: number;
    /** Whether token passed basic checks */
    passed_basic_checks?: boolean;
  };
}

/**
 * Configuration options for ScoringEngine
 */
export interface ScoringEngineOptions {
  /** Weight for honeypot.is data (0-1, default 0.6) */
  honeypotWeight?: number;
  /** Weight for on-chain data (0-1, default 0.4) */
  onchainWeight?: number;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

/**
 * ScoringEngine - Aggregates safety scores from multiple sources
 * 
 * Uses weighted algorithm:
 * - 60% weight to honeypot.is API (scam detection specialist)
 * - 40% weight to on-chain analysis (technical validation)
 * 
 * Usage:
 * ```typescript
 * const engine = new ScoringEngine({ verbose: true });
 * const result = engine.aggregateResults(honeypotData, onchainData);
 * 
 * console.log(`Safety Score: ${result.safety_score}`);
 * console.log(`Risk Level: ${result.risk_level}`);
 * ```
 */
export class ScoringEngine {
  private readonly honeypotWeight: number;
  private readonly onchainWeight: number;
  private readonly verbose: boolean;

  /**
   * Risk level thresholds based on safety_score
   * Higher score = safer token
   */
  private readonly RISK_THRESHOLDS = {
    SAFE: 80,
    LOW_RISK: 60,
    MEDIUM_RISK: 40,
    HIGH_RISK: 20,
    CRITICAL: 0,
  };

  /**
   * Tax thresholds for warnings
   */
  private readonly TAX_THRESHOLDS = {
    LOW: 5,
    MEDIUM: 10,
    HIGH: 20,
    CRITICAL: 50,
  };

  constructor(options: ScoringEngineOptions = {}) {
    this.honeypotWeight = options.honeypotWeight ?? 0.6;
    this.onchainWeight = options.onchainWeight ?? 0.4;
    this.verbose = options.verbose ?? false;

    // Validate weights sum to 1
    const totalWeight = this.honeypotWeight + this.onchainWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(`Weights don't sum to 1.0 (sum: ${totalWeight}), normalizing...`);
      const normFactor = 1.0 / totalWeight;
      this.honeypotWeight *= normFactor;
      this.onchainWeight *= normFactor;
    }

    this.log(`Initialized with weights: honeypot=${this.honeypotWeight}, onchain=${this.onchainWeight}`);
  }

  /**
   * Aggregate results from all sources into final safety assessment
   * 
   * @param honeypotData - Results from honeypot checker
   * @param onchainData - Results from on-chain analyzer
   * @returns Comprehensive safety result
   * 
   * @example
   * ```typescript
   * const result = engine.aggregateResults(honeypotData, onchainData);
   * 
   * if (result.is_honeypot) {
   *   console.error("HONEYPOT DETECTED!");
   * } else if (result.safety_score < 50) {
   *   console.warn("High risk token:", result.warnings);
   * }
   * ```
   */
  aggregateResults(
    honeypotData: Record<string, any>,
    onchainData: Record<string, any>
  ): SafetyResult {
    this.log("Aggregating safety results...");

    // Calculate weighted safety score
    const safetyScore = this.calculateSafetyScore(honeypotData, onchainData);

    // Determine categorical risk level
    const riskLevel = this.getRiskLevel(safetyScore);

    // Check if honeypot
    const isHoneypot = this.checkHoneypot(honeypotData);

    // Calculate confidence in analysis
    const confidence = this.calculateConfidence(honeypotData, onchainData);

    // Generate specific warnings
    const warnings = this.generateWarnings(honeypotData, onchainData);

    // Generate actionable recommendations
    const recommendations = this.generateRecommendations(safetyScore, isHoneypot, warnings);

    // Track which sources provided data
    const sources = this.identifySources(honeypotData, onchainData);

    // Generate additional metadata
    const metadata = this.generateMetadata(honeypotData, onchainData, warnings);

    const result: SafetyResult = {
      safety_score: safetyScore,
      risk_level: riskLevel,
      is_honeypot: isHoneypot,
      confidence,
      warnings,
      recommendations,
      sources_checked: sources,
      raw_data: {
        honeypot: honeypotData,
        onchain: onchainData,
      },
      metadata,
    };

    if (this.verbose) {
      this.log("Aggregation complete:", {
        safety_score: result.safety_score,
        risk_level: result.risk_level,
        is_honeypot: result.is_honeypot,
        confidence: result.confidence,
        warnings_count: result.warnings.length,
        sources: result.sources_checked,
      });
    }

    return result;
  }

  /**
   * Calculate final safety score from multiple sources
   * Returns 0-100 (higher = safer)
   */
  private calculateSafetyScore(
    honeypotData: Record<string, any>,
    onchainData: Record<string, any>
  ): number {
    const scores: number[] = [];
    const weights: number[] = [];

    // Honeypot.is score (convert risk to safety: 100 - risk)
    if (!honeypotData.error) {
      const honeypotRisk = this.safeInt(honeypotData.risk_score, 50);
      const honeypotSafety = 100 - honeypotRisk;
      scores.push(honeypotSafety);
      weights.push(this.honeypotWeight);
      this.log(`Honeypot safety: ${honeypotSafety} (risk: ${honeypotRisk})`);
    }

    // On-chain score (convert risk to safety: 100 - risk)
    if (!onchainData.error) {
      const onchainRisk = this.safeInt(onchainData.risk_score, 50);
      const onchainSafety = 100 - onchainRisk;
      scores.push(onchainSafety);
      weights.push(this.onchainWeight);
      this.log(`On-chain safety: ${onchainSafety} (risk: ${onchainRisk})`);
    }

    // If no sources available, return medium risk
    if (scores.length === 0) {
      this.log("No data sources available, defaulting to medium risk");
      return 50;
    }

    // Calculate weighted average
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    const finalScore = Math.round(weightedSum / totalWeight);

    this.log(`Final safety score: ${finalScore} (from ${scores.length} source(s))`);

    return Math.max(0, Math.min(100, finalScore));
  }

  /**
   * Convert safety score to categorical risk level
   */
  private getRiskLevel(safetyScore: number): SafetyResult["risk_level"] {
    if (safetyScore >= this.RISK_THRESHOLDS.SAFE) return "SAFE";
    if (safetyScore >= this.RISK_THRESHOLDS.LOW_RISK) return "LOW_RISK";
    if (safetyScore >= this.RISK_THRESHOLDS.MEDIUM_RISK) return "MEDIUM_RISK";
    if (safetyScore >= this.RISK_THRESHOLDS.HIGH_RISK) return "HIGH_RISK";
    return "CRITICAL";
  }

  /**
   * Check if token is a honeypot from any source
   */
  private checkHoneypot(honeypotData: Record<string, any>): boolean {
    return Boolean(honeypotData.is_honeypot);
  }

  /**
   * Calculate confidence in analysis (0.0-1.0)
   * Higher when:
   * - Multiple sources available
   * - No errors from sources
   * - More data points collected
   * - Sources agree on assessment
   */
  private calculateConfidence(
    honeypotData: Record<string, any>,
    onchainData: Record<string, any>
  ): number {
    let confidence = 0.5; // Base confidence

    // Both sources available and working
    if (!honeypotData.error && !onchainData.error) {
      confidence += 0.3;
    } else if (!honeypotData.error || !onchainData.error) {
      confidence += 0.1; // At least one source works
    }

    // Honeypot.is has good data
    if (!honeypotData.error) {
      if (honeypotData.contract_verified) confidence += 0.1;
      if (this.safeInt(honeypotData.holder_count) > 100) confidence += 0.05;
      if (honeypotData.metadata?.liquidity_usd > 10000) confidence += 0.05;
    }

    // On-chain data is valid
    if (!onchainData.error && onchainData.is_erc20) {
      confidence += 0.05;
      if (onchainData.checks?.has_name) confidence += 0.025;
      if (onchainData.checks?.has_symbol) confidence += 0.025;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Generate specific warnings based on findings
   */
  private generateWarnings(
    honeypotData: Record<string, any>,
    onchainData: Record<string, any>
  ): string[] {
    const warnings: string[] = [];

    // Critical: Honeypot detected
    if (honeypotData.is_honeypot) {
      warnings.push("⚠️ HONEYPOT DETECTED - Cannot sell this token");
      if (honeypotData.honeypot_reason) {
        warnings.push(`Reason: ${honeypotData.honeypot_reason}`);
      }
    }

    // Tax warnings
    const sellTax = this.safeFloat(honeypotData.sell_tax);
    if (sellTax > this.TAX_THRESHOLDS.CRITICAL) {
      warnings.push(`🚨 CRITICAL sell tax: ${sellTax.toFixed(1)}% - Likely scam`);
    } else if (sellTax > this.TAX_THRESHOLDS.HIGH) {
      warnings.push(`⚠️ Very high sell tax: ${sellTax.toFixed(1)}%`);
    } else if (sellTax > this.TAX_THRESHOLDS.MEDIUM) {
      warnings.push(`⚠️ High sell tax: ${sellTax.toFixed(1)}%`);
    } else if (sellTax > this.TAX_THRESHOLDS.LOW) {
      warnings.push(`ℹ️ Moderate sell tax: ${sellTax.toFixed(1)}%`);
    }

    const buyTax = this.safeFloat(honeypotData.buy_tax);
    if (buyTax > this.TAX_THRESHOLDS.HIGH) {
      warnings.push(`⚠️ Very high buy tax: ${buyTax.toFixed(1)}%`);
    } else if (buyTax > this.TAX_THRESHOLDS.MEDIUM) {
      warnings.push(`⚠️ High buy tax: ${buyTax.toFixed(1)}%`);
    } else if (buyTax > this.TAX_THRESHOLDS.LOW) {
      warnings.push(`ℹ️ Moderate buy tax: ${buyTax.toFixed(1)}%`);
    }

    // Holder concentration
    const top10Percent = this.safeFloat(honeypotData.top_10_holders_percent);
    if (top10Percent > 90) {
      warnings.push(`🚨 EXTREME centralization: Top 10 holders own ${top10Percent.toFixed(1)}%`);
    } else if (top10Percent > 75) {
      warnings.push(`⚠️ Very high centralization: Top 10 holders own ${top10Percent.toFixed(1)}%`);
    } else if (top10Percent > 50) {
      warnings.push(`⚠️ High centralization: Top 10 holders own ${top10Percent.toFixed(1)}%`);
    }

    // Contract verification
    if (honeypotData.contract_verified === false) {
      warnings.push("⚠️ Contract source code not verified");
    }

    // Proxy pattern
    if (honeypotData.is_proxy) {
      warnings.push("⚠️ Proxy contract - Implementation can be changed by owner");
    }

    // On-chain warnings
    if (onchainData.is_contract === false) {
      warnings.push("🚨 Not a smart contract - EOA addresses cannot be tokens");
    }

    if (onchainData.is_erc20 === false && onchainData.is_contract) {
      warnings.push("⚠️ Does not implement standard ERC20 interface");
    }

    const codeSize = onchainData.code_size;
    if (codeSize !== null && codeSize !== undefined) {
      if (codeSize < 100) {
        warnings.push("⚠️ Suspiciously small contract code");
      } else if (codeSize > 50000) {
        warnings.push("⚠️ Unusually large contract - Possible obfuscation");
      }
    }

    return warnings;
  }

  /**
   * Generate actionable recommendations based on analysis
   */
  private generateRecommendations(
    safetyScore: number,
    isHoneypot: boolean,
    warnings: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Honeypot = immediate abort
    if (isHoneypot) {
      recommendations.push("🚫 DO NOT INTERACT - Confirmed honeypot scam");
      recommendations.push("❌ Do not buy, do not hold, report as scam");
      return recommendations;
    }

    // Safe range (80-100)
    if (safetyScore >= 80) {
      recommendations.push("✅ Generally safe to interact");
      recommendations.push("✓ Token appears legitimate based on multiple checks");
      recommendations.push("📝 Always verify contract on blockchain explorer");
      if (warnings.length > 0) {
        recommendations.push(`⚠️ Note ${warnings.length} minor warning(s) - Review them`);
      }
    }
    // Low risk range (60-79)
    else if (safetyScore >= 60) {
      recommendations.push("⚠️ Exercise caution - Some concerns detected");
      recommendations.push("💡 Start with small test transaction (<$10)");
      recommendations.push("🔍 Check recent transactions on blockchain explorer");
      recommendations.push("📊 Verify liquidity and trading volume");
      if (warnings.length > 0) {
        recommendations.push(`⚠️ Review ${warnings.length} warning(s) carefully`);
      }
    }
    // Medium risk range (40-59)
    else if (safetyScore >= 40) {
      recommendations.push("⚠️ HIGH RISK - Proceed with extreme caution");
      recommendations.push("🛑 Only interact if you fully understand the risks");
      recommendations.push("💰 Never invest more than you can afford to lose");
      recommendations.push("🔍 Thoroughly research on multiple sources");
      if (warnings.length > 0) {
        recommendations.push(`🚨 ${warnings.length} significant warning(s) found`);
      }
    }
    // High risk range (20-39)
    else if (safetyScore >= 20) {
      recommendations.push("🚨 VERY HIGH RISK - Strongly advise avoiding");
      recommendations.push("❌ Multiple red flags detected");
      recommendations.push("🛑 High probability of scam or malfunction");
      if (warnings.length > 0) {
        recommendations.push(`🚨 Found ${warnings.length} critical warning(s)`);
      }
      recommendations.push("💡 Consider safer alternatives");
    }
    // Critical range (0-19)
    else {
      recommendations.push("🚫 CRITICAL RISK - DO NOT INTERACT");
      recommendations.push("❌ Severe issues detected across multiple checks");
      recommendations.push("🚨 Almost certainly a scam or broken token");
      if (warnings.length > 0) {
        recommendations.push(`⚠️ ${warnings.length} critical issue(s) found`);
      }
      recommendations.push("🛡️ Protect your funds - avoid this token");
    }

    return recommendations;
  }

  /**
   * Identify which data sources provided results
   */
  private identifySources(
    honeypotData: Record<string, any>,
    onchainData: Record<string, any>
  ): string[] {
    const sources: string[] = [];
    if (!honeypotData.error && honeypotData.source) {
      sources.push(honeypotData.source);
    }
    if (!onchainData.error && onchainData.source) {
      sources.push(onchainData.source);
    }
    return sources;
  }

  /**
   * Generate additional analysis metadata
   */
  private generateMetadata(
    honeypotData: Record<string, any>,
    onchainData: Record<string, any>,
    warnings: string[]
  ): SafetyResult["metadata"] {
    // Categorize tax risk
    const maxTax = Math.max(
      this.safeFloat(honeypotData.buy_tax),
      this.safeFloat(honeypotData.sell_tax)
    );
    const taxRisk = this.categorizeTaxRisk(maxTax);

    // Categorize centralization risk
    const centralizationRisk = this.categorizeCentralizationRisk(
      this.safeFloat(honeypotData.top_10_holders_percent)
    );

    // Categorize technical risk
    const technicalRisk = this.categorizeTechnicalRisk(onchainData);

    // Count red flags (critical warnings)
    const redFlagsCount = warnings.filter((w) => w.includes("🚨")).length;

    // Check if passed basic checks
    const passedBasicChecks =
      onchainData.is_erc20 === true &&
      honeypotData.is_honeypot === false &&
      !warnings.some((w) => w.includes("CRITICAL"));

    return {
      tax_risk: taxRisk,
      centralization_risk: centralizationRisk,
      technical_risk: technicalRisk,
      red_flags_count: redFlagsCount,
      passed_basic_checks: passedBasicChecks,
    };
  }

  /**
   * Categorize tax risk level
   */
  private categorizeTaxRisk(maxTax: number): "none" | "low" | "medium" | "high" | "critical" {
    if (maxTax === 0) return "none";
    if (maxTax <= this.TAX_THRESHOLDS.LOW) return "low";
    if (maxTax <= this.TAX_THRESHOLDS.MEDIUM) return "medium";
    if (maxTax <= this.TAX_THRESHOLDS.HIGH) return "high";
    return "critical";
  }

  /**
   * Categorize centralization risk level
   */
  private categorizeCentralizationRisk(
    top10Percent: number
  ): "none" | "low" | "medium" | "high" | "critical" {
    if (top10Percent === 0) return "none";
    if (top10Percent <= 30) return "low";
    if (top10Percent <= 50) return "medium";
    if (top10Percent <= 75) return "high";
    return "critical";
  }

  /**
   * Categorize technical risk level
   */
  private categorizeTechnicalRisk(
    onchainData: Record<string, any>
  ): "none" | "low" | "medium" | "high" | "critical" {
    if (onchainData.is_contract === false) return "critical";
    if (onchainData.is_erc20 === false) return "high";
    
    const checks = onchainData.checks || {};
    const failedChecks = Object.values(checks).filter((v) => v === false).length;
    
    if (failedChecks === 0) return "none";
    if (failedChecks <= 1) return "low";
    if (failedChecks <= 2) return "medium";
    if (failedChecks <= 3) return "high";
    return "critical";
  }

  /**
   * Safely convert value to integer
   */
  private safeInt(value: any, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : Math.round(num);
  }

  /**
   * Safely convert value to float
   */
  private safeFloat(value: any, defaultValue = 0.0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Conditional logging based on verbose flag
   */
  private log(message: string, data?: any): void {
    if (this.verbose) {
      if (data) {
        console.log(`[ScoringEngine] ${message}`, data);
      } else {
        console.log(`[ScoringEngine] ${message}`);
      }
    }
  }
}
