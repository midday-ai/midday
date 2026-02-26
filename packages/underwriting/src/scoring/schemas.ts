import { z } from "zod";

// ============================================================================
// Stage 1 output: Bank Statement Extraction (Gemini)
// ============================================================================

export const bankStatementExtractionSchema = z.object({
  months: z.array(
    z.object({
      month: z.string().describe("Month name and year, e.g. 'Oct 2025'"),
      year: z.number().describe("Four-digit year"),
      totalDeposits: z.number().describe("Total deposits for the month"),
      totalWithdrawals: z
        .number()
        .describe("Total withdrawals for the month"),
      endingBalance: z
        .number()
        .describe("Ending/closing balance for the month"),
      avgDailyBalance: z
        .number()
        .describe("Average daily balance for the month"),
      nsfCount: z
        .number()
        .describe("Number of NSF/returned items for the month"),
      largestDeposit: z
        .number()
        .describe("Largest single deposit for the month"),
      depositCount: z
        .number()
        .describe("Total number of deposit transactions for the month"),
    }),
  ),
  accountHolder: z
    .string()
    .optional()
    .describe("Name of the account holder"),
  bankName: z.string().optional().describe("Name of the bank"),
  accountType: z
    .string()
    .optional()
    .describe("Type of account (checking, savings, etc.)"),
  suspectedMcaPayments: z
    .array(
      z.object({
        funderName: z.string().describe("Name of the suspected MCA funder"),
        monthlyAmount: z
          .number()
          .describe("Approximate monthly total paid to this funder"),
        frequency: z
          .string()
          .describe("Payment frequency (daily, weekly, etc.)"),
      }),
    )
    .optional()
    .describe(
      "Suspected existing MCA payments identified from recurring debits",
    ),
});

// ============================================================================
// Stage 2 output: Risk Analysis (Claude)
// ============================================================================

export const riskAnalysisSchema = z.object({
  recommendation: z
    .enum(["approve", "decline", "review_needed"])
    .describe("Overall recommendation"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence level in the recommendation"),
  riskFlags: z.array(
    z.object({
      flag: z.string().describe("Short name for the risk flag"),
      severity: z.enum(["high", "medium", "low"]).describe("Risk severity"),
      description: z
        .string()
        .describe("Detailed description of the risk flag"),
    }),
  ),
  aiNarrative: z
    .string()
    .describe(
      "2-3 sentence narrative summarizing the risk assessment and recommendation",
    ),
  bankAnalysis: z.array(
    z.object({
      month: z.string().describe("Month label, e.g. 'Oct 2025'"),
      deposits: z.number().describe("Total deposits for the month"),
      payBurden: z
        .number()
        .describe(
          "Estimated daily payment burden based on the requested amount",
        ),
      holdbackPct: z
        .number()
        .describe(
          "Holdback percentage: payBurden as a percentage of deposits (0-100)",
        ),
    }),
  ),
  extractedMetrics: z.object({
    avgDailyBalance: z.number().describe("Average daily balance across months"),
    monthlyAvgRevenue: z
      .number()
      .describe("Average monthly revenue (deposits)"),
    nsfCount: z.number().describe("Total NSF count across all months"),
    depositConsistency: z
      .number()
      .describe(
        "Deposit consistency score from 0 to 1 (1 = perfectly consistent)",
      ),
    revenueVolatility: z
      .number()
      .describe("Revenue volatility as coefficient of variation (0 = stable)"),
  }),
  priorMcaFlags: z
    .array(
      z.object({
        funder: z.string().describe("MCA funder name"),
        status: z.string().describe("Status of the existing position"),
        details: z
          .string()
          .describe("Details about the existing MCA position"),
      }),
    )
    .optional()
    .describe("Identified prior/existing MCA positions"),
});

// ============================================================================
// Type exports
// ============================================================================

export type BankStatementExtraction = z.infer<
  typeof bankStatementExtractionSchema
>;
export type RiskAnalysis = z.infer<typeof riskAnalysisSchema>;
