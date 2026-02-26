import { ScrollableContent } from "@/components/scrollable-content";
import { UnderwritingContent } from "@/components/underwriting/underwriting-content";
import { UnderwritingSkeleton } from "@/components/underwriting/underwriting-skeleton";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Underwriting | Abacus",
};

export default async function Page() {
  batchPrefetch([trpc.underwriting.getBuyBox.queryOptions()]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <Suspense fallback={<UnderwritingSkeleton />}>
          <UnderwritingContent />
        </Suspense>
      </ScrollableContent>
    </HydrateClient>
  );
}
