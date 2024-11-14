"use client";

import { AreaChart } from "@/components/charts/area-chart";
import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { useUserContext } from "@/store/user/hook";
import { formatDate } from "@/utils/format";
import { addMonths } from "date-fns";

type Props = {
  averageBurnRate: number;
  data: any;
  months: number;
};

export function BurnRateUI({ averageBurnRate, months, data }: Props) {
  const { date_format: dateFormat } = useUserContext((state) => state.data);

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
        <FormatAmount amount={averageBurnRate} currency={data.currency} />
        per month. Your expected runway is {months} months, ending in{" "}
        {formatDate(addMonths(new Date(), months).toISOString(), dateFormat)}.
      </p>

      <AreaChart data={data} height={200} />
    </BotCard>
  );
}
