import type { Metadata } from "next";
import { OverviewView } from "@/components/widgets";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default function Overview() {
  prefetch(trpc.overview.summary.queryOptions());

  return (
    <HydrateClient>
      <OverviewView />
    </HydrateClient>
  );
}
