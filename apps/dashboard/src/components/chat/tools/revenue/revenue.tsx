"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { BotMessage } from "@/components/chat/messages";
import type { GetRevenueResult } from "@/lib/tools/get-revenue";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type Props = {
  result: GetRevenueResult;
};

export function Revenue({ result }: Props) {
  const trpc = useTRPC();

  const { from, to, currency } = result.params;

  const { data, isLoading } = useQuery(
    trpc.reports.revenue.queryOptions({
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
