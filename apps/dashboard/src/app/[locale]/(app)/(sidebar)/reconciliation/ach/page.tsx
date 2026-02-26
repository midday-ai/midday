import { ScrollableContent } from "@/components/scrollable-content";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AchPageContent } from "./ach-page-content";

export const metadata: Metadata = {
  title: "ACH Batches | Abacus",
};

export default async function AchBatchesPage() {
  batchPrefetch([trpc.achBatches.getAll.queryOptions({})]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="py-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            }
          >
            <AchPageContent />
          </Suspense>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
