import { Apps } from "@/components/apps";
import { AppsHeader } from "@/components/apps-header";
import { AppsSkeleton } from "@/components/apps.skeleton";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  prefetch(trpc.apps.installed.queryOptions());

  return (
    <div className="mt-4">
      <AppsHeader />

      <Suspense fallback={<AppsSkeleton />}>
        <Apps />
      </Suspense>
    </div>
  );
}
