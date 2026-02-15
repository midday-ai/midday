import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { TeamsTable } from "@/components/tables/teams";
import { TeamsSkeleton } from "@/components/tables/teams/skeleton";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Teams | Midday",
};

export default function Teams() {
  prefetch(trpc.team.list.queryOptions());
  prefetch(trpc.user.invites.queryOptions());

  return (
    <ErrorBoundary errorComponent={ErrorFallback}>
      <Suspense fallback={<TeamsSkeleton />}>
        <TeamsTable />
      </Suspense>
    </ErrorBoundary>
  );
}
