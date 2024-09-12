import { z } from "zod";

export const RecurringExpenseDetectionSchema = z.object({
  MerchantName: z.string(),
  Category: z.string(),
  AvgAmount: z.number(),
  TransactionCount: z.number().int(),
  UserId: z.string().uuid(),
});
