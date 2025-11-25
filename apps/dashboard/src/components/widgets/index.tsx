"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import type { inferRouterOutputs } from "@trpc/server";
import { Suspense } from "react";
import { SuggestedActions } from "../suggested-actions";
import { WidgetsHeader } from "./header";
import { WidgetProvider, useIsCustomizing } from "./widget-provider";
import { WidgetsGrid } from "./widgets-grid";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WidgetPreferences = RouterOutputs["widgets"]["getWidgetPreferences"];

function SuggestedActionsSkeleton() {
  const skeletonWidths = ["w-28", "w-32", "w-36", "w-28", "w-32", "w-28"];

  return (
    <div className="w-[calc(100%+16px)] md:w-full -mx-4 md:mx-0 md:px-6 mt-10 mb-8 flex items-center justify-center">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide w-full md:w-auto pl-4 md:pl-0">
        {skeletonWidths.map((width) => (
          <Skeleton
            key={`suggested-actions-skeleton-${width}`}
            className={`${width} h-[34px] border border-[#e6e6e6] dark:border-[#1d1d1d] flex-shrink-0`}
          />
        ))}
      </div>
    </div>
  );
}

function WidgetsContent() {
  const { isChatPage, isHome } = useChatInterface();
  const isCustomizing = useIsCustomizing();

  if (isChatPage) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col mt-6",
        isHome && "widgets-container-spacing",
      )}
    >
      <WidgetsHeader />
      <WidgetsGrid />
      {!isCustomizing && (
        <Suspense fallback={<SuggestedActionsSkeleton />}>
          <SuggestedActions />
        </Suspense>
      )}
    </div>
  );
}

interface WidgetsProps {
  initialPreferences: WidgetPreferences;
}

export function Widgets({ initialPreferences }: WidgetsProps) {
  return (
    <WidgetProvider initialPreferences={initialPreferences}>
      <WidgetsContent />
    </WidgetProvider>
  );
}
