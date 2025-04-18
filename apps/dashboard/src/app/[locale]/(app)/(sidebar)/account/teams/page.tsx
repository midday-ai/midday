import { TeamsTable } from "@/components/tables/teams";
import { TeamsSkeleton } from "@/components/tables/teams/skeleton";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Teams | Midday",
};

export default function Teams() {
  prefetch(trpc.team.list.queryOptions());
  prefetch(trpc.user.invites.queryOptions());

  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <TeamsTable />
    </Suspense>
  );
}
