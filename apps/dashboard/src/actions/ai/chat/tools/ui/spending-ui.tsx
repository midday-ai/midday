"use client";

import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { useUserContext } from "@/store/user/hook";
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
  const { date_format: dateFormat } = useUserContext((state) => state.data);

  if (!amount) {
    return (
      <BotCard>
        We couldn't find any spending in this category {category} between{" "}
        {formatDate(startDate, dateFormat)} and{" "}
        {formatDate(endDate, dateFormat)}
      </BotCard>
    );
  }

  return (
    <BotCard>
      You have spent{" "}
      <FormatAmount amount={Math.abs(amount)} currency={currency} /> on {name}{" "}
      between {formatDate(startDate, dateFormat)} and{" "}
      {formatDate(endDate, dateFormat)}
    </BotCard>
  );
}
