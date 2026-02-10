"use client";

import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { BaseCanvas } from "./base-canvas";
import { CanvasContent } from "./canvas-content";
import { CanvasHeader } from "./canvas-header";

export function CanvasErrorFallback() {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <BaseCanvas>
      <CanvasHeader title="Error" />
      <CanvasContent>
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <div className="text-xs text-[#707070] dark:text-[#666666] mb-4">
            Error loading content
          </div>
          <button
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-2 text-xs text-[#707070] dark:text-[#666666] hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <Icons.ArrowBack className="size-3" />
            Go back
          </button>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
