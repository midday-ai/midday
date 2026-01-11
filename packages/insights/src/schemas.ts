/**
 * Zod validation schemas for @midday/insights
 */
import { z } from "zod/v4";

export const periodTypeSchema = z.enum([
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const changeDirectionSchema = z.enum(["up", "down", "flat"]);

export const anomalySeveritySchema = z.enum(["info", "warning", "alert"]);

export const insightMetricSchema = z.object({
  type: z.string(),
  label: z.string(),
  value: z.number(),
  previousValue: z.number(),
  change: z.number(),
  changeDirection: changeDirectionSchema,
  unit: z.string().optional(),
  currency: z.string().optional(),
  historicalContext: z.string().optional(),
});

export const insightAnomalySchema = z.object({
  type: z.string(),
  severity: anomalySeveritySchema,
  message: z.string(),
  metricType: z.string().optional(),
});

export const insightMilestoneSchema = z.object({
  type: z.string(),
  description: z.string(),
  achievedAt: z.string(),
});

export const upcomingInvoiceItemSchema = z.object({
  customerName: z.string(),
  amount: z.number(),
  scheduledAt: z.string(),
  frequency: z.string().optional(),
});

export const insightActivitySchema = z.object({
  invoicesSent: z.number(),
  invoicesPaid: z.number(),
  invoicesOverdue: z.number(),
  overdueAmount: z.number().optional(),
  hoursTracked: z.number(),
  unbilledHours: z.number(),
  billableAmount: z.number().optional(),
  largestPayment: z
    .object({
      customer: z.string(),
      amount: z.number(),
    })
    .optional(),
  newCustomers: z.number(),
  receiptsMatched: z.number(),
  transactionsCategorized: z.number(),
  upcomingInvoices: z
    .object({
      count: z.number(),
      totalAmount: z.number(),
      nextDueDate: z.string().optional(),
      items: z.array(upcomingInvoiceItemSchema).optional(),
    })
    .optional(),
});

export const insightActionSchema = z.object({
  text: z.string(),
  type: z.string().optional(),
  deepLink: z.string().optional(),
});

export const insightContentSchema = z.object({
  goodNews: z.string(),
  story: z.string(),
  actions: z.array(insightActionSchema),
  celebration: z.string().optional(),
});

export const generateInsightParamsSchema = z.object({
  teamId: z.string().uuid(),
  periodType: periodTypeSchema,
  periodStart: z.date(),
  periodEnd: z.date(),
  periodLabel: z.string(),
  periodYear: z.number().int().min(2000).max(2100),
  periodNumber: z.number().int().min(1).max(53),
  currency: z.string().length(3),
});

export const metricDataSchema = z.object({
  revenue: z.number(),
  expenses: z.number(),
  netProfit: z.number(),
  cashFlow: z.number(),
  profitMargin: z.number(),
  runwayMonths: z.number(),
});
