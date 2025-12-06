import { RunsTable } from "@/components/runs-table";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

// Force dynamic rendering - this page requires runtime data from Redis
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RunsPage() {
  // Prefetch recent jobs data on the server
  // Wrap in try/catch to prevent errors from bubbling up and being redacted
  try {
    await prefetch(trpc.jobs.recent.queryOptions({ limit: 50 }));
  } catch (error) {
    // Log error but don't throw - allow page to render with empty state
    console.error("[RunsPage] Error prefetching data:", error);
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div className="pt-6">
          <h1 className="text-[18px] font-normal font-serif text-primary mb-2">
            Runs
          </h1>
        </div>
        <Suspense
          fallback={
            <div className="text-muted-foreground">Loading runs...</div>
          }
        >
          <RunsTable />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
