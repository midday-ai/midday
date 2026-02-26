import { WIDGET_TYPES } from "@midday/cache/widget-preferences-cache";
import { z } from "zod";

export const getRunwaySchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getRevenueSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getRevenueSummarySchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
  revenueType: z.enum(["gross", "net"]).optional().default("net"),
});

export const getGrowthRateSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
  type: z.enum(["revenue", "profit"]).optional().default("revenue"),
  revenueType: z.enum(["gross", "net"]).optional().default("net"),
  period: z
    .enum(["quarterly", "monthly", "yearly"])
    .optional()
    .default("quarterly"),
});

export const getProfitMarginSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
  revenueType: z.enum(["gross", "net"]).optional().default("net"),
});

export const getCashFlowSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
  period: z.enum(["monthly", "quarterly"]).optional().default("monthly"),
});

export const getOutstandingInvoicesSchema = z.object({
  currency: z.string().optional(),
  status: z
    .array(z.enum(["unpaid", "overdue"]))
    .optional()
    .default(["unpaid", "overdue"]),
});

export const getInboxStatsSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getVaultActivitySchema = z.object({
  limit: z.number().optional().default(5),
});

export const getAccountBalancesSchema = z.object({
  currency: z.string().optional(),
});

export const getNetPositionSchema = z.object({
  currency: z.string().optional(),
});

export const getMonthlySpendingSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getRecurringExpensesSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getCategoryExpensesSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
  limit: z.number().optional().default(5),
});

export const getOverdueInvoicesAlertSchema = z
  .object({
    currency: z.string().optional(),
  })
  .optional();

export const getMerchantLifetimeValueSchema = z.object({
  currency: z.string().optional(),
});

// MCA widget schemas
export const getPortfolioOverviewSchema = z.object({
  currency: z.string().optional(),
});

export const getActiveDealsSchema = z.object({});

export const getCollectionRateSchema = z.object({
  currency: z.string().optional(),
});

export const getNsfAlertsSchema = z.object({});

export const getDealPipelineSchema = z.object({});

export const widgetTypeSchema = z.enum(WIDGET_TYPES);

export const widgetPreferencesSchema = z.object({
  primaryWidgets: z.array(widgetTypeSchema).max(8),
  availableWidgets: z.array(widgetTypeSchema),
});

export const updateWidgetPreferencesSchema = z.object({
  primaryWidgets: z.array(widgetTypeSchema).max(8),
});
