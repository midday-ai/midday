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

export const widgetTypeSchema = z.enum([
  "runway",
  "top-customer",
  "revenue-summary",
  "growth-rate",
  "profit-margin",
  "cash-flow",
  "outstanding-invoices",
  "inbox",
]);

export const widgetPreferencesSchema = z.object({
  primaryWidgets: z.array(widgetTypeSchema).max(7),
  availableWidgets: z.array(widgetTypeSchema),
});

export const updateWidgetPreferencesSchema = z.object({
  primaryWidgets: z.array(widgetTypeSchema).max(7),
});
