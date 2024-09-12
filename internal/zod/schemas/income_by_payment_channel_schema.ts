import { z } from "zod";

export const IncomeByPaymentChannelSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  PaymentChannel: z.string(),
  TotalIncome: z.number().nonnegative(),
  TransactionCount: z.number().int().nonnegative(),
  UserId: z.string().uuid(),
});
