"use client";

import { ActivityTimeline } from "@/components/collections/activity-timeline";
import { AddNoteForm } from "@/components/collections/add-note-form";
import { CaseDealSummary } from "@/components/collections/case-deal-summary";
import { CaseDetailHeader } from "@/components/collections/case-detail-header";
import { CaseMerchantInfo } from "@/components/collections/case-merchant-info";
import { CaseSlaIndicators } from "@/components/collections/case-sla-indicators";
import { ScrollableContent } from "@/components/scrollable-content";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@midday/ui/skeleton";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";

type CaseData = NonNullable<RouterOutputs["collections"]["getById"]>;

type Props = {
  caseId: string;
  initialData: CaseData;
};

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-[30px] rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CollectionDetailContent({ caseId, initialData }: Props) {
  const trpc = useTRPC();

  const { data: caseData } = useQuery({
    ...trpc.collections.getById.queryOptions({ id: caseId }),
    initialData,
  });

  if (!caseData) return null;

  const isResolved = !!caseData.resolvedAt;

  return (
    <ScrollableContent>
      <div className="max-w-[1200px] mx-auto pb-12">
        <CaseDetailHeader data={caseData} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          {/* Left column: 60% */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add note form (only for active cases) */}
            {!isResolved && (
              <div className="border border-border bg-background p-4">
                <h3 className="text-sm font-medium mb-3">Add Note</h3>
                <AddNoteForm caseId={caseId} />
              </div>
            )}

            {/* Activity Timeline */}
            <div className="border border-border bg-background p-4">
              <h3 className="text-sm font-medium mb-4">Activity</h3>
              <Suspense fallback={<TimelineSkeleton />}>
                <ActivityTimeline caseId={caseId} />
              </Suspense>
            </div>
          </div>

          {/* Right column: 40% */}
          <div className="lg:col-span-2 space-y-4">
            <CaseDealSummary data={caseData} />
            <CaseMerchantInfo data={caseData} />
            <CaseSlaIndicators data={caseData} />
          </div>
        </div>
      </div>
    </ScrollableContent>
  );
}
