"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent } from "@midday/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useInsightFromUrl } from "@/hooks/use-insight-from-url";
import { useOverviewTab } from "@/hooks/use-overview-tab";
import { usePrefetchMetrics } from "@/hooks/use-prefetch-metrics";
import { useTRPC } from "@/trpc/client";
import { MetricsView } from "../metrics/metrics-view";
import { SuggestedActions } from "../suggested-actions";
import { WidgetsHeader } from "./header";
import {
  useIsCustomizing,
  useWidgetActions,
  WidgetProvider,
} from "./widget-provider";
import { WidgetsGrid } from "./widgets-grid";

function SuggestedActionsSkeleton() {
  const skeletonWidths = ["w-28", "w-32", "w-36", "w-28", "w-32", "w-28"];

  return (
    <div className="w-[calc(100%+16px)] md:w-full -mx-4 md:mx-0 md:px-6 mt-10 mb-8 flex items-center justify-center">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide w-full md:w-auto pl-4 md:pl-0">
        {skeletonWidths.map((width, index) => (
          <Skeleton
            key={`suggested-actions-skeleton-${index.toString()}`}
            className={`${width} h-[34px] border border-[#e6e6e6] dark:border-[#1d1d1d] flex-shrink-0`}
          />
        ))}
      </div>
    </div>
  );
}

function WidgetGridSkeleton() {
  return (
    <>
      {/* Mobile: single column */}
      <div className="lg:hidden flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`widget-skeleton-mobile-${index.toString()}`}
            className="h-[210px] w-full border border-[#e6e6e6] dark:border-[#1d1d1d]"
          />
        ))}
      </div>

      {/* Desktop: matches the actual 4-column grid */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`widget-skeleton-${index.toString()}`}
            className="h-[210px] border border-[#e6e6e6] dark:border-[#1d1d1d]"
          />
        ))}
      </div>
    </>
  );
}

function WidgetsContent() {
  const trpc = useTRPC();
  const { isChatPage, isHome } = useChatInterface();
  const isCustomizing = useIsCustomizing();
  const { setWidgetPreferences } = useWidgetActions();
  const { tab, setTab } = useOverviewTab();

  const { data: preferences, isPending } = useQuery(
    trpc.widgets.getWidgetPreferences.queryOptions(),
  );

  // Update the store when preferences arrive from the server
  useEffect(() => {
    if (preferences) {
      setWidgetPreferences(preferences);
    }
  }, [preferences, setWidgetPreferences]);

  // Prefetch metrics data in background when on overview tab
  usePrefetchMetrics();

  // Handle ?insight= query parameter from email links
  useInsightFromUrl();

  if (isChatPage) {
    return null;
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div
        className={cn(
          "flex flex-col mt-6",
          isHome && "widgets-container-spacing",
        )}
      >
        <WidgetsHeader />
        <TabsContent value="overview">
          {isPending ? <WidgetGridSkeleton /> : <WidgetsGrid />}
          {!isCustomizing && (
            <Suspense fallback={<SuggestedActionsSkeleton />}>
              <SuggestedActions />
            </Suspense>
          )}
        </TabsContent>
        <TabsContent value="metrics">
          <MetricsView />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export function Widgets() {
  return (
    <WidgetProvider>
      <WidgetsContent />
    </WidgetProvider>
  );
}
