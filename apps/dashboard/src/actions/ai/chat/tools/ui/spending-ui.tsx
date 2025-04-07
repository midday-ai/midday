"use client";

import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { useUserQuery } from "@/hooks/use-user";
import { formatDate } from "@/utils/format";

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
  const { data: user } = useUserQuery();

  if (!amount) {
    return (
      <BotCard>
        We couldn't find any spending in this category {category} between{" "}
        {formatDate(startDate, user?.date_format)} and{" "}
        {formatDate(endDate, user?.date_format)}
      </BotCard>
    );
  }

  return (
    <BotCard>
      You have spent{" "}
      <FormatAmount amount={Math.abs(amount)} currency={currency} /> on {name}{" "}
      between {formatDate(startDate, user?.date_format)} and{" "}
      {formatDate(endDate, user?.date_format)}
    </BotCard>
  );
}
