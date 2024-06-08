"use client";

import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { format } from "date-fns";

type Props = {
  amount: number;
  currency: string;
  category: string;
  name?: string;
  startDate: string;
  endDate: string;
};

export function SpendingUI({
  amount,
  currency,
  category,
  name,
  startDate,
  endDate,
}: Props) {
  if (!amount) {
    return (
      <BotCard>
        We couldn't find any spending in this category {category} between{" "}
        {format(new Date(startDate), "PP")} and{" "}
        {format(new Date(endDate), "PP")}
      </BotCard>
    );
  }

  return (
    <BotCard>
      You have spent{" "}
      <FormatAmount amount={Math.abs(amount)} currency={currency} /> on {name}{" "}
      between {format(new Date(startDate), "PP")} and{" "}
      {format(new Date(endDate), "PP")}
    </BotCard>
  );
}
