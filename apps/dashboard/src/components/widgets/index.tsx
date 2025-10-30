"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
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
  return (
    <div className="w-full px-6 py-4 flex items-center justify-center">
      <div className="flex gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton
            key={`suggested-skeleton-${Date.now()}-${i}`}
            className="h-10 w-24"
          />
        ))}
      </div>
    </div>
  );
}

function WidgetsContent() {
  const { isChatPage } = useChatInterface();
  const isCustomizing = useIsCustomizing();

  if (isChatPage) {
    return null;
  }

  return (
    <div className="flex flex-col mt-6">
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
