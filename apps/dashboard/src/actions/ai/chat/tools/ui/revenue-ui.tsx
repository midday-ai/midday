"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { format } from "date-fns";

type Props = {
  data: any;
  startDate: string;
  endDate: string;
};

export function RevenueUI({ data, startDate, endDate }: Props) {
  if (!data?.result?.length) {
    return (
      <BotCard>
        We couldn't find any data to provide you with a revenue summary.
      </BotCard>
    );
  }
  return (
    <BotCard className="font-sans space-y-16">
      <div>
        <p className="font-mono">
          Based on the period from {format(new Date(startDate), "PP")} and{" "}
          {format(new Date(endDate), "PP")} your revenue is{" "}
          <FormatAmount
            amount={data.summary.currentTotal}
            currency={data.summary.currency}
          />
          . In the previous period, your profit was{" "}
          <FormatAmount
            maximumFractionDigits={0}
            minimumFractionDigits={0}
            amount={data.summary.prevTotal || 0}
            currency={data.summary.currency}
          />
          .
        </p>
      </div>

      <BarChart data={data} currency={data.summary.currency} height={200} />
    </BotCard>
  );
}
