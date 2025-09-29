"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";
import { SuggestedActions } from "../suggested-actions";
import { WidgetsHeader } from "./header";
import { WidgetsGrid } from "./widgets-grid";

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

export function Widgets() {
  const { isChatPage } = useChatInterface();

  if (isChatPage) {
    return null;
  }

  return (
    <div className="flex flex-col mt-6">
      <WidgetsHeader />
      <WidgetsGrid />
      <Suspense fallback={<SuggestedActionsSkeleton />}>
        <SuggestedActions />
      </Suspense>
    </div>
  );
}
