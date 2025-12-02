import { getWriter } from "@ai-sdk-tools/artifacts";
import { openai } from "@ai-sdk/openai";
import type { AppContext } from "@api/ai/agents/config/shared";
import {
  metricsBreakdownCategoriesArtifact,
  metricsBreakdownCustomersArtifact,
  metricsBreakdownInvoicesArtifact,
  metricsBreakdownSummaryArtifact,
  metricsBreakdownTransactionsArtifact,
  metricsBreakdownVendorsArtifact,
} from "@api/ai/artifacts/metrics-breakdown";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { getToolDateDefaults } from "@api/ai/utils/tool-date-defaults";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import {
  getInvoices,
  getReports,
  getSpending,
  getSpendingForPeriod,
  getTransactions,
} from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText } from "ai";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { z } from "zod";

const getMetricsBreakdownSchema = z.object({
  from: z.string().optional().describe("Start date (ISO 8601)"),
  to: z.string().optional().describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  chartType: z
    .string()
    .optional()
    .describe("Type of chart that triggered this breakdown"),
  showCanvas: z.boolean().default(true).describe("Show visual analytics"),
});

export const getMetricsBreakdownTool = tool({
  description:
    "Get a comprehensive breakdown of financial metrics for a specific period. Use this tool when the user requests a 'breakdown', 'break down', 'show me a breakdown', 'breakdown of', 'detailed breakdown', or 'comprehensive breakdown' of any financial metric (revenue, expenses, profit, burn rate, etc.). Provides revenue, expenses, profit, transactions, invoices, category breakdowns, and top vendors/customers. ALWAYS use this tool (not getBurnRate, getRevenueSummary, etc.) when 'breakdown' is mentioned in the request.",
  inputSchema: getMetricsBreakdownSchema,
  execute: async function* (
    { from, to, currency, chartType, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve metrics breakdown: Team ID not found in context.",
      };
      return {
        summary: {
          revenue: 0,
          expenses: 0,
          profit: 0,
          transactionCount: 0,
          invoiceCount: 0,
        },
        transactions: [],
        invoices: [],
        categories: [],
        topVendors: [],
        topCustomers: [],
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      // Use fiscal year-aware defaults if dates not provided
      const defaultDates = getToolDateDefaults(appContext.fiscalYearStartMonth);
      const finalFrom = from ?? defaultDates.from;
      const finalTo = to ?? defaultDates.to;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize multiple artifacts if showCanvas is true
      let summaryAnalysis:
        | ReturnType<typeof metricsBreakdownSummaryArtifact.stream>
        | undefined;
      let transactionsAnalysis:
        | ReturnType<typeof metricsBreakdownTransactionsArtifact.stream>
        | undefined;
      let invoicesAnalysis:
        | ReturnType<typeof metricsBreakdownInvoicesArtifact.stream>
        | undefined;
      let categoriesAnalysis:
        | ReturnType<typeof metricsBreakdownCategoriesArtifact.stream>
        | undefined;
      let vendorsAnalysis:
        | ReturnType<typeof metricsBreakdownVendorsArtifact.stream>
        | undefined;
      let customersAnalysis:
        | ReturnType<typeof metricsBreakdownCustomersArtifact.stream>
        | undefined;

      if (showCanvas) {
        const writer = getWriter(executionOptions);
        const baseData = {
          stage: "loading" as const,
          currency: currency || appContext.baseCurrency || "USD",
          from: finalFrom,
          to: finalTo,
          description,
          chartType: chartType || undefined,
        };

        summaryAnalysis = metricsBreakdownSummaryArtifact.stream(
          baseData,
          writer,
        );
        transactionsAnalysis = metricsBreakdownTransactionsArtifact.stream(
          baseData,
          writer,
        );
        invoicesAnalysis = metricsBreakdownInvoicesArtifact.stream(
          baseData,
          writer,
        );
        categoriesAnalysis = metricsBreakdownCategoriesArtifact.stream(
          baseData,
          writer,
        );
        vendorsAnalysis = metricsBreakdownVendorsArtifact.stream(
          baseData,
          writer,
        );
        customersAnalysis = metricsBreakdownCustomersArtifact.stream(
          baseData,
          writer,
        );
      }

      const targetCurrency = currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";

      // Fetch revenue data
      const revenueResult = await getReports(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: currency ?? undefined,
        type: "revenue",
        revenueType: "net",
      });

      // Fetch expenses data
      const spendingCategories = await getSpending(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: currency ?? undefined,
      });

      const periodSummary = await getSpendingForPeriod(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: currency ?? undefined,
      });

      // Fetch profit data
      const profitResult = await getReports(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: currency ?? undefined,
        type: "profit",
        revenueType: "net",
      });

      // Fetch transactions
      const transactionsResult = await getTransactions(db, {
        teamId,
        start: finalFrom,
        end: finalTo,
        sort: ["date", "desc"],
        pageSize: 50,
      });

      // Fetch invoices
      const invoicesResult = await getInvoices(db, {
        teamId,
        start: finalFrom,
        end: finalTo,
        sort: ["createdAt", "desc"],
        pageSize: 50,
      });

      // Calculate summary metrics
      const revenue = revenueResult.summary.currentTotal;
      const expenses = Math.abs(periodSummary.totalSpending);
      const profit = profitResult.summary.currentTotal;
      const transactionCount = transactionsResult.data.length;
      const invoiceCount = invoicesResult.data.length;

      // Format transactions
      const formattedTransactions = transactionsResult.data.map((tx) => {
        const formatted = formatAmount({
          amount: Math.abs(tx.amount),
          currency: tx.currency || targetCurrency,
          locale,
        });
        return {
          id: tx.id,
          date: format(new Date(tx.date), "MMM d, yyyy"),
          name: tx.name,
          amount: tx.amount,
          formattedAmount:
            formatted ||
            `${targetCurrency}${Math.abs(tx.amount).toLocaleString()}`,
          category: tx.category?.name || "Uncategorized",
          type: (tx.amount >= 0 ? "income" : "expense") as "income" | "expense",
          vendor: tx.name,
        };
      });

      // Format invoices
      const formattedInvoices = invoicesResult.data.map((inv) => {
        const formatted = formatAmount({
          amount: inv.amount ?? 0,
          currency: inv.currency || targetCurrency,
          locale,
        });
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || "Draft",
          customerName: inv.customerName || inv.customer?.name || "No customer",
          amount: inv.amount ?? 0,
          formattedAmount:
            formatted ||
            `${targetCurrency}${(inv.amount ?? 0).toLocaleString()}`,
          status: inv.status,
          dueDate: inv.dueDate
            ? format(new Date(inv.dueDate), "MMM d, yyyy")
            : null,
          createdAt: format(new Date(inv.createdAt), "MMM d, yyyy"),
        };
      });

      // Count transactions per category
      const categoryTransactionCounts = new Map<string, number>();
      for (const tx of transactionsResult.data) {
        const categoryName = tx.category?.name || "Uncategorized";
        categoryTransactionCounts.set(
          categoryName,
          (categoryTransactionCounts.get(categoryName) || 0) + 1,
        );
      }

      // Format categories
      const formattedCategories = spendingCategories.map((cat) => ({
        name: cat.name,
        amount: cat.amount,
        percentage: cat.percentage,
        transactionCount: categoryTransactionCounts.get(cat.name) || 0,
        color: cat.color || undefined,
      }));

      // Calculate top vendors (from expense transactions)
      const expenseTransactions = transactionsResult.data.filter(
        (tx) => tx.amount < 0,
      );
      const vendorMap = new Map<string, { amount: number; count: number }>();
      for (const tx of expenseTransactions) {
        const vendor = tx.name;
        const existing = vendorMap.get(vendor) || { amount: 0, count: 0 };
        vendorMap.set(vendor, {
          amount: existing.amount + Math.abs(tx.amount),
          count: existing.count + 1,
        });
      }

      const topVendors = Array.from(vendorMap.entries())
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          transactionCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Calculate top customers (from invoices)
      const customerMap = new Map<
        string,
        { revenue: number; invoiceCount: number }
      >();
      for (const inv of invoicesResult.data) {
        const customer = inv.customerName || inv.customer?.name || "Unknown";
        const existing = customerMap.get(customer) || {
          revenue: 0,
          invoiceCount: 0,
        };
        customerMap.set(customer, {
          revenue: existing.revenue + (inv.amount ?? 0),
          invoiceCount: existing.invoiceCount + 1,
        });
      }

      const topCustomers = Array.from(customerMap.entries())
        .map(([name, data]) => ({
          name,
          revenue: data.revenue,
          invoiceCount: data.invoiceCount,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Update all artifacts with data
      const summaryData = {
        revenue,
        expenses,
        profit,
        transactionCount,
        invoiceCount,
      };

      if (showCanvas) {
        // Summary artifact (includes metrics and categories)
        // First update with chart data (categories)
        if (summaryAnalysis) {
          await summaryAnalysis.update({
            stage: "chart_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            categories: formattedCategories,
          });
        }

        // Then update summary artifact with metrics
        if (summaryAnalysis) {
          await summaryAnalysis.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            summary: summaryData,
            categories: formattedCategories,
          });
        }

        // Transactions artifact
        if (transactionsAnalysis) {
          await transactionsAnalysis.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            transactions: formattedTransactions.slice(0, 50),
            summary: summaryData,
          });
        }

        // Invoices artifact
        if (invoicesAnalysis) {
          await invoicesAnalysis.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            invoices: formattedInvoices.slice(0, 50),
            summary: summaryData,
          });
        }

        // Categories artifact
        if (categoriesAnalysis) {
          await categoriesAnalysis.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            categories: formattedCategories,
            summary: summaryData,
          });
        }

        // Vendors artifact
        if (vendorsAnalysis) {
          await vendorsAnalysis.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            topVendors,
            summary: summaryData,
          });
        }

        // Customers artifact
        if (customersAnalysis) {
          await customersAnalysis.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: finalFrom,
            to: finalTo,
            description,
            chartType: chartType || undefined,
            topCustomers,
            summary: summaryData,
          });
        }
      }

      // Generate AI summary
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this financial breakdown for ${appContext.companyName || "the business"} from ${format(new Date(finalFrom), "MMM d, yyyy")} to ${format(new Date(finalTo), "MMM d, yyyy")}:

Revenue: ${formatAmount({ amount: revenue, currency: targetCurrency, locale })}
Expenses: ${formatAmount({ amount: expenses, currency: targetCurrency, locale })}
Profit: ${formatAmount({ amount: profit, currency: targetCurrency, locale })}
Transactions: ${transactionCount}
Invoices: ${invoiceCount}

Top Categories:
${formattedCategories
  .slice(0, 5)
  .map(
    (cat) =>
      `- ${cat.name}: ${formatAmount({ amount: cat.amount, currency: targetCurrency, locale })} (${cat.percentage.toFixed(1)}%)`,
  )
  .join("\n")}

Top Vendors:
${topVendors
  .slice(0, 5)
  .map(
    (v) =>
      `- ${v.name}: ${formatAmount({ amount: v.amount, currency: targetCurrency, locale })}`,
  )
  .join("\n")}

Top Customers:
${topCustomers
  .slice(0, 5)
  .map(
    (c) =>
      `- ${c.name}: ${formatAmount({ amount: c.revenue, currency: targetCurrency, locale })}`,
  )
  .join("\n")}

Provide a concise analysis (3-4 sentences) highlighting key insights, trends, and notable patterns. Write it as natural, flowing text.`,
          },
        ],
      });

      const summaryText =
        analysisResult.text.trim() ||
        `Financial breakdown showing ${formatAmount({ amount: revenue, currency: targetCurrency, locale })} in revenue, ${formatAmount({ amount: expenses, currency: targetCurrency, locale })} in expenses, resulting in ${formatAmount({ amount: profit, currency: targetCurrency, locale })} profit.`;

      // Update summary artifact with analysis (only summary gets the analysis)
      if (showCanvas && summaryAnalysis) {
        await summaryAnalysis.update({
          stage: "analysis_ready",
          analysis: {
            summary: summaryText,
            recommendations: [],
          },
        });
      }

      // Format text response
      const formattedRevenue = formatAmount({
        amount: revenue,
        currency: targetCurrency,
        locale,
      });
      const formattedExpenses = formatAmount({
        amount: expenses,
        currency: targetCurrency,
        locale,
      });
      const formattedProfit = formatAmount({
        amount: profit,
        currency: targetCurrency,
        locale,
      });

      let responseText: string;

      if (showCanvas) {
        // Simplified text-focused response when canvas is shown
        responseText = `Financial breakdown for ${format(new Date(finalFrom), "MMM d, yyyy")} to ${format(new Date(finalTo), "MMM d, yyyy")}: ${formattedRevenue} in revenue, ${formattedExpenses} in expenses, resulting in ${formattedProfit} profit.`;
        responseText +=
          "\n\nA detailed visual breakdown with charts, transactions, invoices, categories, vendors, and customers is available.";
      } else {
        // Full detailed breakdown when canvas is not shown
        responseText = "**Financial Breakdown**\n\n";
        responseText += "**Summary:**\n";
        responseText += `- Revenue: ${formattedRevenue}\n`;
        responseText += `- Expenses: ${formattedExpenses}\n`;
        responseText += `- Profit: ${formattedProfit}\n`;
        responseText += `- Transactions: ${transactionCount}\n`;
        responseText += `- Invoices: ${invoiceCount}\n\n`;

        if (formattedCategories.length > 0) {
          responseText += "**Top Categories:**\n";
          for (const cat of formattedCategories.slice(0, 5)) {
            responseText += `- ${cat.name}: ${formatAmount({
              amount: cat.amount,
              currency: targetCurrency,
              locale,
            })} (${cat.percentage.toFixed(1)}%)\n`;
          }
          responseText += "\n";
        }

        if (topVendors.length > 0) {
          responseText += "**Top Vendors:**\n";
          for (const vendor of topVendors.slice(0, 5)) {
            responseText += `- ${vendor.name}: ${formatAmount({
              amount: vendor.amount,
              currency: targetCurrency,
              locale,
            })} (${vendor.transactionCount} transactions)\n`;
          }
          responseText += "\n";
        }

        if (topCustomers.length > 0) {
          responseText += "**Top Customers:**\n";
          for (const customer of topCustomers.slice(0, 5)) {
            responseText += `- ${customer.name}: ${formatAmount({
              amount: customer.revenue,
              currency: targetCurrency,
              locale,
            })} (${customer.invoiceCount} invoices)\n`;
          }
        }
      }

      yield {
        text: responseText,
      };

      return {
        summary: {
          revenue,
          expenses,
          profit,
          transactionCount,
          invoiceCount,
        },
        transactions: formattedTransactions,
        invoices: formattedInvoices,
        categories: formattedCategories,
        topVendors,
        topCustomers,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve metrics breakdown: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      throw error;
    }
  },
});
