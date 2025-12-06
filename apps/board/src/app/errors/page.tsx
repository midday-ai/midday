import { ErrorGrouping } from "@/components/error-grouping";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ErrorsPage() {
  try {
    await prefetch(trpc.jobs.errors.queryOptions({ limit: 50 }));
  } catch (error) {
    console.error("[ErrorsPage] Error prefetching data:", error);
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6 pt-6">
        <h1 className="text-[18px] font-normal font-serif text-primary mb-2">
          Error Analysis
        </h1>
        <Suspense
          fallback={
            <div className="text-muted-foreground">Loading errors...</div>
          }
        >
          <ErrorGrouping />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
