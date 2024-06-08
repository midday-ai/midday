"use client";

import { BotCard } from "@/components/chat/messages";
import { addMonths, format } from "date-fns";

type Props = {
  months: number;
};

export function RunwayUI({ months }: Props) {
  if (!months) {
    return (
      <BotCard>
        We couldn't find any historical data to provide you with a runway.
      </BotCard>
    );
  }

  return (
    <BotCard>
      Based on your historical data, your expected runway is {months} months,
      ending in {format(addMonths(new Date(), months), "PP")}.
    </BotCard>
  );
}
