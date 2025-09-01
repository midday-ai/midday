"use client";

import { AreaChart } from "@/components/charts/area-chart";
import { BotMessage } from "@/components/chat/messages";
import type { GetBurnRateResult } from "@/lib/tools/get-burn-rate";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type Props = {
  result: GetBurnRateResult;
};

export function BurnRate({ result }: Props) {
  const trpc = useTRPC();

  const { from, to, currency } = result.params;

  const { data, isLoading } = useQuery(
    trpc.reports.burnRate.queryOptions({
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
      <AreaChart data={data} height={200} />
    </BotMessage>
  );
}
