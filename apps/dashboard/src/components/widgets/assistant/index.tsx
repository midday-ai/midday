import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { AssistantWidget } from "./assistant-widget";

export async function Assistant() {
  return (
    <div className="border aspect-square overflow-hidden relative flex flex-col p-4 md:p-8">
      <h2 className="text-lg">Assistant</h2>

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <AssistantWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
