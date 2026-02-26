import { getWriter } from "@ai-sdk-tools/artifacts";
import { openai } from "@ai-sdk/openai";
import type { AppContext } from "@api/ai/agents/config/shared";
import { dealPaymentAnalysisArtifact } from "@api/ai/artifacts/deal-payment-analysis";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { db } from "@midday/db/client";
import { getDealPaymentAnalysis } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText } from "ai";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getDealPaymentAnalysisSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe("Start date (ISO 8601)"),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getDealPaymentAnalysisTool = tool({
  description:
    "Analyze deal payment patterns - shows average days to pay, payment trends, overdue deal summary, and payment score.",
  inputSchema: getDealPaymentAnalysisSchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve deal payment analysis: Team ID not found in context.",
      };
      return {
        averageDaysToPay: 0,
        paymentRate: 0,
        overdueRate: 0,
        paymentScore: 0,
        totalDeals: 0,
        paidDeals: 0,
        unpaidDeals: 0,
        overdueDeals: 0,
        overdueAmount: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    try {
      // Generate description based on date range
      const description = generateArtifactDescription(from, to);

      // Initialize artifact only if showCanvas is true
      let analysis:
        | ReturnType<typeof dealPaymentAnalysisArtifact.stream>
        | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = dealPaymentAnalysisArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
            from,
            to,
            description,
          },
          writer,
        );
      }

      const targetCurrency = currency || appContext.baseCurrency || "USD";

      // Fetch payment analysis data
      const paymentData = await getDealPaymentAnalysis(db, {
        teamId,
        from,
        to,
        currency: currency || undefined,
      });

      if (paymentData.metrics.totalDeals === 0) {
        const emptyMessage =
          "No deals found in the specified date range for payment analysis.";
        yield { text: emptyMessage };
        return {
          averageDaysToPay: 0,
          paymentRate: 0,
          overdueRate: 0,
          paymentScore: 0,
          totalDeals: 0,
          paidDeals: 0,
          unpaidDeals: 0,
          overdueDeals: 0,
          overdueAmount: 0,
          currency: targetCurrency,
        };
      }

      // Update artifact with chart data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from,
          to,
          description,
          chart: {
            monthlyData: paymentData.paymentTrends.map((trend) => ({
              month: trend.month,
              averageDaysToPay: trend.averageDaysToPay,
              paymentRate: trend.paymentRate,
              dealCount: trend.dealCount,
            })),
          },
        });
      }

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          metrics: paymentData.metrics,
          overdueSummary: paymentData.overdueSummary,
        });
      }

      // Generate AI analysis
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this deal payment data for ${appContext.companyName || "the business"}:
            
**Payment Metrics:**
- Average days to pay: ${paymentData.metrics.averageDaysToPay} days
- Payment rate: ${paymentData.metrics.paymentRate}%
- Overdue rate: ${paymentData.metrics.overdueRate}%
- Payment score: ${paymentData.metrics.paymentScore}/100
- Total deals: ${paymentData.metrics.totalDeals}
- Paid deals: ${paymentData.metrics.paidDeals}
- Unpaid deals: ${paymentData.metrics.unpaidDeals}
- Overdue deals: ${paymentData.metrics.overdueDeals}
- Overdue amount: ${formatAmount({ amount: paymentData.metrics.overdueAmount, currency: targetCurrency })}

**Overdue Summary:**
- Overdue count: ${paymentData.overdueSummary.count}
- Total overdue amount: ${formatAmount({ amount: paymentData.overdueSummary.totalAmount, currency: targetCurrency })}
- Oldest overdue: ${paymentData.overdueSummary.oldestDays} days

**Payment Trends (last 3 months):**
${paymentData.paymentTrends
  .slice(-3)
  .map(
    (t) =>
      `- ${t.month}: ${t.averageDaysToPay} days avg, ${t.paymentRate}% paid`,
  )
  .join("\n")}

Provide a concise 2-3 sentence summary analyzing the payment patterns and 2-3 actionable recommendations for improving cash collection.`,
          },
        ],
      });

      const aiResponseText = analysisResult.text;

      // Parse summary and recommendations from AI response
      const summaryMatch = aiResponseText.match(
        /(?:summary|analysis)[:\s]*(.+?)(?:\n\n|$)/i,
      );
      const summary = summaryMatch?.[1]
        ? summaryMatch[1].trim()
        : aiResponseText.split("\n\n")[0] || aiResponseText;

      const recommendations: string[] = [];
      const recMatches = aiResponseText.match(
        /(?:recommendations?|suggestions?)[:\s]*\n?([\s\S]+?)(?:\n\n|$)/i,
      );
      if (recMatches?.[1]) {
        const recText = recMatches[1];
        const recLines = recText
          .split("\n")
          .map((line) => line.replace(/^[-*•]\s*/, "").trim())
          .filter((line) => line.length > 0);
        recommendations.push(...recLines.slice(0, 3));
      } else {
        // Try to extract bullet points
        const bulletMatches = aiResponseText.matchAll(/[-*•]\s*(.+)/g);
        for (const match of bulletMatches) {
          if (recommendations.length < 3 && match[1]) {
            recommendations.push(match[1].trim());
          }
        }
      }

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          analysis: {
            summary: summary || "Payment analysis complete.",
            recommendations: recommendations.length > 0 ? recommendations : [],
          },
        });
      }

      // Format text response
      const formattedOverdueAmount = formatAmount({
        amount: paymentData.metrics.overdueAmount,
        currency: targetCurrency,
        locale: appContext.locale,
      });

      const responseText = `## Deal Payment Analysis

**Payment Metrics:**
- Average days to pay: **${paymentData.metrics.averageDaysToPay} days**
- Payment rate: **${paymentData.metrics.paymentRate}%** (${paymentData.metrics.paidDeals}/${paymentData.metrics.totalDeals} deals paid)
- Overdue rate: **${paymentData.metrics.overdueRate}%** (${paymentData.metrics.overdueDeals} deals overdue)
- Payment score: **${paymentData.metrics.paymentScore}/100**

**Overdue Summary:**
- Overdue deals: ${paymentData.overdueSummary.count}
- Total overdue amount: ${formattedOverdueAmount}
- Oldest overdue: ${paymentData.overdueSummary.oldestDays} days

**Analysis:**
${summary}

${recommendations.length > 0 ? `**Recommendations:**\n${recommendations.map((r) => `- ${r}`).join("\n")}` : ""}`;

      yield { text: responseText };

      return {
        averageDaysToPay: paymentData.metrics.averageDaysToPay,
        paymentRate: paymentData.metrics.paymentRate,
        overdueRate: paymentData.metrics.overdueRate,
        paymentScore: paymentData.metrics.paymentScore,
        totalDeals: paymentData.metrics.totalDeals,
        paidDeals: paymentData.metrics.paidDeals,
        unpaidDeals: paymentData.metrics.unpaidDeals,
        overdueDeals: paymentData.metrics.overdueDeals,
        overdueAmount: paymentData.metrics.overdueAmount,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve deal payment analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        averageDaysToPay: 0,
        paymentRate: 0,
        overdueRate: 0,
        paymentScore: 0,
        totalDeals: 0,
        paidDeals: 0,
        unpaidDeals: 0,
        overdueDeals: 0,
        overdueAmount: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
