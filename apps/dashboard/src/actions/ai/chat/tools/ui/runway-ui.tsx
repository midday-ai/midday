"use client";

import { BotCard } from "@/components/chat/messages";
import { useUserContext } from "@/store/user/hook";
import { formatDate } from "@/utils/format";
import { addMonths } from "date-fns";

type Props = {
  months: number;
};

export function RunwayUI({ months }: Props) {
  const { date_format: dateFormat } = useUserContext((state) => state.data);

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
      ending in{" "}
      {formatDate(addMonths(new Date(), months).toISOString(), dateFormat)}.
    </BotCard>
  );
}
