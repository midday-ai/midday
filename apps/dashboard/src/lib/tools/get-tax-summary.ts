import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export type GetTaxSummaryResult = Awaited<
  ReturnType<typeof getTaxSummary.execute>
>;

export const getTaxSummary = tool({
  description:
    "Get tax summary for paid or collected taxes, optionally filtered by category and tax type",
  parameters: z.object({
    from: z.coerce
      .date()
      .describe("The start date of the tax summary, in ISO-8601 format")
      // Default to 12 months ago
      .default(subMonths(new Date(), 12)),
    to: z.coerce
      .date()
      .describe("The end date of the tax summary, in ISO-8601 format")
      .default(new Date()),
    currency: z.string().describe("The currency for tax summary").optional(),
    type: z
      .enum(["paid", "collected"])
      .describe("Type of tax - paid (tax expenses) or collected (tax revenue)")
      .default("paid"),
    categorySlug: z
      .string()
      .describe("Filter by specific category slug")
      .optional(),
    taxType: z
      .string()
      .describe("Filter by specific tax type (e.g., 'vat', 'sales_tax')")
      .optional(),
  }),
  execute: async ({ from, to, currency, type, categorySlug, taxType }) => {
    const queryClient = getQueryClient();

    const data = await queryClient.fetchQuery(
      trpc.metrics.taxSummary.queryOptions({
        from: startOfMonth(new Date(from)).toISOString(),
        to: new Date(to).toISOString(),
        currency,
        type,
        categorySlug,
        taxType,
      }),
    );

    const { summary, result } = data;

    return {
      summary: {
        totalTaxAmount: summary.totalTaxAmount,
        totalTransactionAmount: summary.totalTransactionAmount,
        totalTransactions: summary.totalTransactions,
        categoryCount: summary.categoryCount,
        currency: summary.currency,
        type: summary.type,
      },
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      filters: {
        currency,
        categorySlug,
        taxType,
      },
      categories:
        result?.map((category) => ({
          name: category.category_name,
          slug: category.category_slug,
          taxAmount: category.total_tax_amount,
          transactionAmount: category.total_transaction_amount,
          transactionCount: category.transaction_count,
          averageTaxRate: category.avg_tax_rate,
          taxType: category.tax_type,
          currency: category.currency,
          dateRange: {
            from: category.earliest_date,
            to: category.latest_date,
          },
        })) || [],
    };
  },
});
