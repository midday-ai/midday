import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { balanceSheetArtifact } from "@api/ai/artifacts/balance-sheet";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getBalanceSheet } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const getBalanceSheetSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z
    .string()
    .optional()
    .describe("End date (yyyy-MM-dd) - used as 'as of' date"),
  currency: z.string().nullable().optional().describe("Currency code"),
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getBalanceSheetTool = tool({
  description:
    "Generate balance sheet - assets, liabilities, and equity as of a date.",
  inputSchema: getBalanceSheetSchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve balance sheet: Team ID not found in context.",
      };
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      // Resolve parameters with proper priority:
      // 1. Forced params from widget click (if this tool was triggered by widget)
      // 2. Explicit AI params (user override)
      // 3. Dashboard metricsFilter (source of truth)
      // 4. Hardcoded defaults
      const resolved = resolveToolParams({
        toolName: "getBalanceSheet",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      // Use 'to' date as the asOf date (balance sheet is a snapshot as of a specific date)
      const asOfDate = format(parseISO(finalTo), "yyyy-MM-dd");

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof balanceSheetArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = balanceSheetArtifact.stream(
          {
            stage: "loading",
            currency: targetCurrency,
            asOf: asOfDate,
            from: finalFrom,
            to: finalTo,
            description,
          },
          writer,
        );
      }

      // Fetch balance sheet data
      const balanceSheetData = await getBalanceSheet(db, {
        teamId,
        currency: finalCurrency ?? undefined,
        asOf: asOfDate,
      });

      // Calculate financial ratios
      const currentAssets = balanceSheetData.assets.current.total;
      const currentLiabilities = balanceSheetData.liabilities.current.total;
      const totalLiabilities = balanceSheetData.liabilities.total;
      const totalEquity = balanceSheetData.equity.total;
      const totalAssets = balanceSheetData.assets.total;

      const currentRatio =
        currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
      const workingCapital = currentAssets - currentLiabilities;
      const equityRatio =
        totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0;

      // Generate summary analysis
      const summaryParts: string[] = [];
      const recommendations: string[] = [];

      if (currentRatio >= 2) {
        summaryParts.push(
          "Strong liquidity position with current assets exceeding current liabilities.",
        );
      } else if (currentRatio >= 1) {
        summaryParts.push(
          "Adequate liquidity position with current assets covering current liabilities.",
        );
      } else {
        summaryParts.push(
          "Low liquidity position - current liabilities exceed current assets.",
        );
        recommendations.push(
          "Consider improving cash flow or reducing short-term debt.",
        );
      }

      if (debtToEquity < 1) {
        summaryParts.push("Conservative debt levels relative to equity.");
      } else if (debtToEquity > 2) {
        summaryParts.push("High debt levels relative to equity.");
        recommendations.push(
          "Consider reducing debt or increasing equity to improve financial stability.",
        );
      } else {
        summaryParts.push("Moderate debt levels relative to equity.");
      }

      if (equityRatio >= 50) {
        summaryParts.push(
          "Strong equity position providing a stable foundation.",
        );
      } else if (equityRatio < 30) {
        summaryParts.push(
          "Low equity ratio - consider increasing capital investment.",
        );
        recommendations.push(
          "Consider increasing owner investment or retaining more earnings.",
        );
      }

      const summary = summaryParts.join(" ");

      // Format text response based on showCanvas
      let responseText: string;

      if (showCanvas) {
        // Minimal response when canvas is shown - details are in the visual
        responseText = `**Balance Sheet as of ${asOfDate}**\n\n`;
        responseText += `${summary}`;

        if (recommendations.length > 0) {
          responseText += "\n\n**Key Recommendations:**\n";
          for (const rec of recommendations.slice(0, 2)) {
            responseText += `- ${rec}\n`;
          }
        }

        responseText +=
          "\n\nA detailed visual balance sheet with complete breakdown, financial ratios, and all line items is available.";
      } else {
        // Detailed text response when canvas is not shown
        const formattedCash = formatAmount({
          amount: balanceSheetData.assets.current.cash,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedReceivables = formatAmount({
          amount: balanceSheetData.assets.current.accountsReceivable,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedInventory = formatAmount({
          amount: balanceSheetData.assets.current.inventory,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedPrepaidExpenses = formatAmount({
          amount: balanceSheetData.assets.current.prepaidExpenses,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedFixedAssets = formatAmount({
          amount: balanceSheetData.assets.nonCurrent.fixedAssets,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedSoftware = formatAmount({
          amount: balanceSheetData.assets.nonCurrent.softwareTechnology,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedTotalAssets = formatAmount({
          amount: balanceSheetData.assets.total,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedAccountsPayable = formatAmount({
          amount: balanceSheetData.liabilities.current.accountsPayable,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedAccruedExpenses = formatAmount({
          amount: balanceSheetData.liabilities.current.accruedExpenses,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedShortTermDebt = formatAmount({
          amount: balanceSheetData.liabilities.current.shortTermDebt,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedLongTermDebt = formatAmount({
          amount: balanceSheetData.liabilities.nonCurrent.longTermDebt,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedDeferredRevenue = formatAmount({
          amount: balanceSheetData.liabilities.nonCurrent.deferredRevenue,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedTotalLiabilities = formatAmount({
          amount: balanceSheetData.liabilities.total,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedCapitalInvestment = formatAmount({
          amount: balanceSheetData.equity.capitalInvestment,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedOwnerDraws = formatAmount({
          amount: balanceSheetData.equity.ownerDraws,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedRetainedEarnings = formatAmount({
          amount: balanceSheetData.equity.retainedEarnings,
          currency: balanceSheetData.currency,
          locale,
        });
        const formattedTotalEquity = formatAmount({
          amount: balanceSheetData.equity.total,
          currency: balanceSheetData.currency,
          locale,
        });

        responseText = `**Balance Sheet as of ${asOfDate}**\n\n`;
        responseText += "**ASSETS**\n\n";
        responseText += "**Current Assets:**\n";
        responseText += `- Cash and Cash Equivalents: ${formattedCash}\n`;
        responseText += `- Accounts Receivable: ${formattedReceivables}\n`;
        if (balanceSheetData.assets.current.inventory !== 0) {
          responseText += `- ${balanceSheetData.assets.current.inventoryName || "Inventory"}: ${formattedInventory}\n`;
        }
        if (balanceSheetData.assets.current.prepaidExpenses !== 0) {
          responseText += `- ${balanceSheetData.assets.current.prepaidExpensesName || "Prepaid Expenses"}: ${formattedPrepaidExpenses}\n`;
        }
        responseText += `- **Total Current Assets:** ${formatAmount({
          amount: balanceSheetData.assets.current.total,
          currency: balanceSheetData.currency,
          locale,
        })}\n\n`;
        responseText += "**Non-Current Assets:**\n";
        if (balanceSheetData.assets.nonCurrent.fixedAssets !== 0) {
          responseText += `- ${balanceSheetData.assets.nonCurrent.fixedAssetsName || "Fixed Assets"}: ${formattedFixedAssets}\n`;
        }
        if (balanceSheetData.assets.nonCurrent.accumulatedDepreciation !== 0) {
          responseText += `- Accumulated Depreciation: ${formatAmount({
            amount: balanceSheetData.assets.nonCurrent.accumulatedDepreciation,
            currency: balanceSheetData.currency,
            locale,
          })}\n`;
        }
        if (balanceSheetData.assets.nonCurrent.softwareTechnology !== 0) {
          responseText += `- ${balanceSheetData.assets.nonCurrent.softwareTechnologyName || "Software & Technology"}: ${formattedSoftware}\n`;
        }
        if (balanceSheetData.assets.nonCurrent.longTermInvestments !== 0) {
          responseText += `- ${balanceSheetData.assets.nonCurrent.longTermInvestmentsName || "Long-term Investments"}: ${formatAmount(
            {
              amount: balanceSheetData.assets.nonCurrent.longTermInvestments,
              currency: balanceSheetData.currency,
              locale,
            },
          )}\n`;
        }
        responseText += `- **Total Non-Current Assets:** ${formatAmount({
          amount: balanceSheetData.assets.nonCurrent.total,
          currency: balanceSheetData.currency,
          locale,
        })}\n\n`;
        responseText += `**TOTAL ASSETS:** ${formattedTotalAssets}\n\n`;
        responseText += "**LIABILITIES**\n\n";
        responseText += "**Current Liabilities:**\n";
        if (balanceSheetData.liabilities.current.accountsPayable !== 0) {
          responseText += `- Accounts Payable: ${formattedAccountsPayable}\n`;
        }
        if (balanceSheetData.liabilities.current.accruedExpenses !== 0) {
          responseText += `- ${balanceSheetData.liabilities.current.accruedExpensesName || "Accrued Expenses"}: ${formattedAccruedExpenses}\n`;
        }
        if (balanceSheetData.liabilities.current.shortTermDebt !== 0) {
          responseText += `- Short-term Debt: ${formattedShortTermDebt}\n`;
        }
        responseText += `- **Total Current Liabilities:** ${formatAmount({
          amount: balanceSheetData.liabilities.current.total,
          currency: balanceSheetData.currency,
          locale,
        })}\n\n`;
        responseText += "**Non-Current Liabilities:**\n";
        if (balanceSheetData.liabilities.nonCurrent.longTermDebt !== 0) {
          responseText += `- Long-term Debt: ${formattedLongTermDebt}\n`;
        }
        if (balanceSheetData.liabilities.nonCurrent.deferredRevenue !== 0) {
          responseText += `- ${balanceSheetData.liabilities.nonCurrent.deferredRevenueName || "Deferred Revenue"}: ${formattedDeferredRevenue}\n`;
        }
        responseText += `- **Total Non-Current Liabilities:** ${formatAmount({
          amount: balanceSheetData.liabilities.nonCurrent.total,
          currency: balanceSheetData.currency,
          locale,
        })}\n\n`;
        responseText += `**TOTAL LIABILITIES:** ${formattedTotalLiabilities}\n\n`;
        responseText += "**EQUITY**\n\n";
        if (balanceSheetData.equity.capitalInvestment !== 0) {
          responseText += `- ${balanceSheetData.equity.capitalInvestmentName || "Capital Investment"}: ${formattedCapitalInvestment}\n`;
        }
        if (balanceSheetData.equity.ownerDraws !== 0) {
          responseText += `- ${balanceSheetData.equity.ownerDrawsName || "Owner Draws"}: ${formattedOwnerDraws}\n`;
        }
        responseText += `- Retained Earnings: ${formattedRetainedEarnings}\n`;
        responseText += `- **Total Equity:** ${formattedTotalEquity}\n\n`;
        responseText += `**TOTAL LIABILITIES AND EQUITY:** ${formatAmount({
          amount: totalAssets,
          currency: balanceSheetData.currency,
          locale,
        })}\n\n`;
        responseText += "**Financial Ratios:**\n";
        responseText += `- Current Ratio: ${currentRatio.toFixed(2)}:1\n`;
        responseText += `- Debt-to-Equity: ${debtToEquity.toFixed(2)}:1\n`;
        responseText += `- Working Capital: ${formatAmount({
          amount: workingCapital,
          currency: balanceSheetData.currency,
          locale,
        })}\n`;
        responseText += `- Equity Ratio: ${equityRatio.toFixed(1)}%\n\n`;
        responseText += `**Summary:**\n${summary}`;

        if (recommendations.length > 0) {
          responseText += "\n\n**Recommendations:**\n";
          for (const rec of recommendations) {
            responseText += `- ${rec}\n`;
          }
        }
      }

      yield { text: responseText };

      // Update artifact if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: balanceSheetData.currency,
          asOf: asOfDate,
          from: finalFrom,
          to: finalTo,
          description,
          balanceSheet: balanceSheetData,
          metrics: {
            totalAssets: balanceSheetData.assets.total,
            totalLiabilities: balanceSheetData.liabilities.total,
            totalEquity: balanceSheetData.equity.total,
            currentRatio,
            debtToEquity,
            workingCapital,
            equityRatio,
          },
        });

        await analysis.update({
          stage: "analysis_ready",
          currency: balanceSheetData.currency,
          asOf: asOfDate,
          from: finalFrom,
          to: finalTo,
          description,
          balanceSheet: balanceSheetData,
          metrics: {
            totalAssets: balanceSheetData.assets.total,
            totalLiabilities: balanceSheetData.liabilities.total,
            totalEquity: balanceSheetData.equity.total,
            currentRatio,
            debtToEquity,
            workingCapital,
            equityRatio,
          },
          analysis: {
            summary,
            recommendations,
          },
        });
      }

      return {
        totalAssets: balanceSheetData.assets.total,
        totalLiabilities: balanceSheetData.liabilities.total,
        totalEquity: balanceSheetData.equity.total,
        currency: balanceSheetData.currency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve balance sheet: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
