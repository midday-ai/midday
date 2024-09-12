import { z } from "zod";

export const WeekendWeekdaySpendingSchema = z.object({
  Month: z.number().int(),
  DayType: z.enum(["Weekend", "Weekday"]),
  TotalSpend: z.number(),
  UserId: z.string().uuid(),
});
