"use client";

import { AreaChart } from "@/components/charts/area-chart";
import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { addMonths, format } from "date-fns";

type Props = {
  averageBurnRate: number;
  currency: string;
  data: any;
  months: number;
};

export function BurnRateUI({ averageBurnRate, currency, months, data }: Props) {
  if (!data?.length) {
    return (
      <BotCard>
        We couldn't find any historical data to provide you with a burn rate.
      </BotCard>
    );
  }
  return (
    <BotCard className="font-sans space-y-4">
      <p className="font-mono">
        Based on your historical data, your avarage burn rate is{" "}
        <FormatAmount amount={averageBurnRate} currency={currency} /> per month.
        Your expected runway is {months} months, ending in{" "}
        {format(addMonths(new Date(), months), "PP")}.
      </p>

      <AreaChart currency={currency} data={data} height={200} />
    </BotCard>
  );
}
