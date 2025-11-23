import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const balanceSheetArtifact = artifact(
  "balance-sheet-canvas",
  z.object({
    // Processing stage
    stage: z.enum([
      "loading",
      "chart_ready",
      "metrics_ready",
      "analysis_ready",
    ]),

    // Basic info
    currency: z.string(),
    asOf: z.string().optional(), // Date as of which balance sheet is calculated
    from: z.string().optional().describe("Start date (ISO 8601)"),
    to: z.string().optional().describe("End date (ISO 8601)"),
    description: z
      .string()
      .optional()
      .describe("Generated description based on date range"),

    // Chart data (available at chart_ready stage)
    chart: z
      .object({
        monthlyData: z.array(
          z.object({
            month: z.string(),
            assets: z.number(),
            liabilities: z.number(),
            equity: z.number(),
          }),
        ),
      })
      .optional(),

    // Detailed balance sheet data (available at metrics_ready stage)
    balanceSheet: z
      .object({
        assets: z.object({
          current: z.object({
            cash: z.number(),
            accountsReceivable: z.number(),
            inventory: z.number(),
            inventoryName: z.string().optional(),
            prepaidExpenses: z.number(),
            prepaidExpensesName: z.string().optional(),
            total: z.number(),
          }),
          nonCurrent: z.object({
            fixedAssets: z.number(),
            fixedAssetsName: z.string().optional(),
            accumulatedDepreciation: z.number(),
            softwareTechnology: z.number(),
            softwareTechnologyName: z.string().optional(),
            longTermInvestments: z.number(),
            longTermInvestmentsName: z.string().optional(),
            otherAssets: z.number(),
            total: z.number(),
          }),
          total: z.number(),
        }),
        liabilities: z.object({
          current: z.object({
            accountsPayable: z.number(),
            accruedExpenses: z.number(),
            accruedExpensesName: z.string().optional(),
            shortTermDebt: z.number(),
            creditCardDebt: z.number(),
            creditCardDebtName: z.string().optional(),
            total: z.number(),
          }),
          nonCurrent: z.object({
            longTermDebt: z.number(),
            deferredRevenue: z.number(),
            deferredRevenueName: z.string().optional(),
            leases: z.number(),
            leasesName: z.string().optional(),
            otherLiabilities: z.number(),
            total: z.number(),
          }),
          total: z.number(),
        }),
        equity: z.object({
          capitalInvestment: z.number(),
          capitalInvestmentName: z.string().optional(),
          ownerDraws: z.number(),
          ownerDrawsName: z.string().optional(),
          retainedEarnings: z.number(),
          total: z.number(),
        }),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        totalAssets: z.number(),
        totalLiabilities: z.number(),
        totalEquity: z.number(),
        currentRatio: z.number().optional(),
        debtToEquity: z.number().optional(),
        workingCapital: z.number().optional(),
        equityRatio: z.number().optional(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        summary: z.string(),
        recommendations: z.array(z.string()),
      })
      .optional(),
  }),
);
