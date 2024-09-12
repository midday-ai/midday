import { z } from "zod";

export const ExpenseDistributionByPaymentChannelSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  PaymentChannel: z.string(),
  TotalExpense: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
