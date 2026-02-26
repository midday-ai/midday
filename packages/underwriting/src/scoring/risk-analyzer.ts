import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import type { BuyBoxResult } from "./buy-box-check";
import { type RiskAnalysis, riskAnalysisSchema } from "./schemas";
import type { BankStatementExtraction } from "./schemas";

// ============================================================================
// Stage 2: Risk Analysis with Claude
// ============================================================================

const anthropic = createAnthropic();

export type RiskAnalyzerParams = {
  extraction: BankStatementExtraction;
  buyBoxResult: BuyBoxResult;
  requestedAmountMin?: number;
  requestedAmountMax?: number;
  brokerNotes?: string;
  priorMcaHistory?: string;
  ficoRange?: string;
  timeInBusinessMonths?: number;
  industry?: string;
};

/**
 * Build the analysis prompt with all available context.
 */
function buildAnalysisPrompt(params: RiskAnalyzerParams): string {
  const {
    extraction,
    buyBoxResult,
    requestedAmountMin,
    requestedAmountMax,
    brokerNotes,
    priorMcaHistory,
    ficoRange,
    timeInBusinessMonths,
    industry,
  } = params;

  const sections: string[] = [];

  // Header
  sections.push(
    "You are a senior MCA (Merchant Cash Advance) underwriter performing risk analysis.",
    "Analyze ALL provided data and produce a comprehensive risk scorecard.",
    "",
  );

  // Bank statement data
  sections.push("=== BANK STATEMENT DATA ===");
  if (extraction.accountHolder) {
    sections.push(`Account Holder: ${extraction.accountHolder}`);
  }
  if (extraction.bankName) {
    sections.push(`Bank: ${extraction.bankName}`);
  }
  if (extraction.accountType) {
    sections.push(`Account Type: ${extraction.accountType}`);
  }
  sections.push("");

  sections.push("Monthly Summary:");
  for (const month of extraction.months) {
    sections.push(
      `  ${month.month}: Deposits=$${month.totalDeposits.toLocaleString()}, ` +
        `Withdrawals=$${month.totalWithdrawals.toLocaleString()}, ` +
        `Ending Balance=$${month.endingBalance.toLocaleString()}, ` +
        `Avg Daily Balance=$${month.avgDailyBalance.toLocaleString()}, ` +
        `NSFs=${month.nsfCount}, ` +
        `Deposit Count=${month.depositCount}, ` +
        `Largest Deposit=$${month.largestDeposit.toLocaleString()}`,
    );
  }
  sections.push("");

  // Suspected MCA payments
  if (
    extraction.suspectedMcaPayments &&
    extraction.suspectedMcaPayments.length > 0
  ) {
    sections.push("=== SUSPECTED EXISTING MCA POSITIONS ===");
    for (const mca of extraction.suspectedMcaPayments) {
      sections.push(
        `  ${mca.funderName}: $${mca.monthlyAmount.toLocaleString()}/month (${mca.frequency})`,
      );
    }
    sections.push("");
  }

  // Buy box results
  sections.push("=== BUY BOX CHECK RESULTS ===");
  sections.push(
    `Overall: ${buyBoxResult.allPassed ? "PASSED" : "FAILED"} (${buyBoxResult.passCount}/${buyBoxResult.totalCount} criteria met)`,
  );
  for (const criterion of buyBoxResult.criteria) {
    sections.push(
      `  ${criterion.passed ? "PASS" : "FAIL"} - ${criterion.name}: Actual=${criterion.actualValue}, Required=${criterion.requiredValue}`,
    );
  }
  sections.push("");

  // Requested amount
  if (requestedAmountMin != null || requestedAmountMax != null) {
    sections.push("=== REQUESTED AMOUNT ===");
    if (requestedAmountMin != null && requestedAmountMax != null) {
      sections.push(
        `Range: $${requestedAmountMin.toLocaleString()} - $${requestedAmountMax.toLocaleString()}`,
      );
    } else if (requestedAmountMin != null) {
      sections.push(`Minimum: $${requestedAmountMin.toLocaleString()}`);
    } else if (requestedAmountMax != null) {
      sections.push(`Maximum: $${requestedAmountMax.toLocaleString()}`);
    }
    sections.push("");
  }

  // Additional context
  sections.push("=== MERCHANT CONTEXT ===");
  if (ficoRange) sections.push(`FICO Range: ${ficoRange}`);
  if (timeInBusinessMonths != null) {
    sections.push(`Time in Business: ${timeInBusinessMonths} months`);
  }
  if (industry) sections.push(`Industry: ${industry}`);
  sections.push("");

  if (brokerNotes) {
    sections.push("=== BROKER NOTES ===");
    sections.push(brokerNotes);
    sections.push("");
  }

  if (priorMcaHistory) {
    sections.push("=== PRIOR MCA HISTORY ===");
    sections.push(priorMcaHistory);
    sections.push("");
  }

  // Analysis instructions
  sections.push("=== ANALYSIS INSTRUCTIONS ===");
  sections.push("");
  sections.push("1. BANK ANALYSIS: For each month, calculate:");
  sections.push(
    "   - Pay burden: estimated daily payment if the requested amount (use midpoint of range) were funded",
  );
  sections.push(
    "     Assume a standard factor rate of 1.35 and a 6-month term for calculation",
  );
  sections.push(
    "     Daily payment = (requestedAmount * 1.35) / (6 * 22 working days)",
  );
  sections.push(
    "     Monthly pay burden = daily payment * 22 working days",
  );
  sections.push(
    "   - Holdback percentage: (monthly pay burden / monthly deposits) * 100",
  );
  sections.push("");
  sections.push("2. EXTRACTED METRICS: Calculate:");
  sections.push(
    "   - Average daily balance across all months",
  );
  sections.push(
    "   - Monthly average revenue (average of all months' deposits)",
  );
  sections.push("   - Total NSF count across all months");
  sections.push(
    "   - Deposit consistency: score 0-1 based on how consistent monthly deposit totals are (1 = perfectly consistent). Use: 1 - (std_dev / mean) capped at 0-1",
  );
  sections.push(
    "   - Revenue volatility: coefficient of variation of monthly deposits (std_dev / mean). Lower is better.",
  );
  sections.push("");
  sections.push("3. RISK FLAGS: Identify and flag any concerns:");
  sections.push("   - High NSF count (>3/month)");
  sections.push("   - Declining revenue trend");
  sections.push(
    "   - Holdback percentage >15% is concerning, >25% is high risk",
  );
  sections.push("   - Multiple existing MCA positions (stacking)");
  sections.push("   - Large one-time deposits inflating revenue");
  sections.push("   - Negative ending balances");
  sections.push("   - High revenue volatility (CV > 0.3)");
  sections.push("");
  sections.push("4. RECOMMENDATION:");
  sections.push(
    '   - "approve" if: buy box passed, holdback <15%, minimal risk flags, consistent revenue',
  );
  sections.push(
    '   - "decline" if: buy box failed on critical criteria, holdback >25%, severe risk flags, or high stacking',
  );
  sections.push(
    '   - "review_needed" if: borderline cases, mixed signals, or insufficient data',
  );
  sections.push("");
  sections.push("5. AI NARRATIVE: Write a 2-3 sentence summary explaining:");
  sections.push(
    "   - The overall financial health of the merchant",
  );
  sections.push("   - Key risk factors or strengths");
  sections.push(
    "   - Why you made this recommendation",
  );
  sections.push("");
  sections.push("6. CONFIDENCE:");
  sections.push(
    '   - "high" if: 3+ months of data, clear financials, definitive recommendation',
  );
  sections.push(
    '   - "medium" if: 2 months of data, some ambiguity, or mixed signals',
  );
  sections.push(
    '   - "low" if: <2 months of data, poor quality statements, or highly uncertain',
  );

  return sections.join("\n");
}

/**
 * Analyze risk using Claude to produce a comprehensive scorecard.
 *
 * Takes the extracted bank statement data, buy box results, and additional
 * context to produce a recommendation with supporting analysis.
 */
export async function analyzeRisk(
  params: RiskAnalyzerParams,
): Promise<RiskAnalysis> {
  const prompt = buildAnalysisPrompt(params);

  const result = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: riskAnalysisSchema,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  });

  return result.object;
}
