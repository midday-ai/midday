"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { BotMessage } from "@/components/chat/messages";
import type { GetProfitResult } from "@/lib/tools/get-profit";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type Props = {
  result: GetProfitResult;
};

export function Profit({ result }: Props) {
  const trpc = useTRPC();

  const { from, to, currency } = result.params;

  const { data, isLoading } = useQuery(
    trpc.reports.profit.queryOptions({
      from,
      to,
      currency,
    }),
  );

  if (isLoading) {
    return null;
  }

  return (
    <BotMessage className="text-xs font-sans mb-8">
      <BarChart data={data} height={200} />
    </BotMessage>
  );
}
