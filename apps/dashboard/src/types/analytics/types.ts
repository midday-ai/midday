import { z } from "zod";

const AccountBalanceGrowthRateDataType = z.object({
  growthRate: z.number(),
  date: z.string(),
});

const AccountBalanceDataType = z.object({
  balance: z.number(),
  date: z.string(),
});

const TimeseriesDataType = z.object({
  date: z.string(),
  value: z.number(),
});

type TimeseriesDataType = z.infer<typeof TimeseriesDataType>;

type AccountBalanceGrowthRateDataType = z.infer<
  typeof AccountBalanceGrowthRateDataType
>;
type AccountBalanceDataType = z.infer<typeof AccountBalanceDataType>;

export {
  AccountBalanceDataType,
  AccountBalanceGrowthRateDataType,
  TimeseriesDataType,
};
