"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { cn } from "@midday/ui/cn";
import { ProgressToast } from "./progress-toast";

export function BaseCanvas({ children }: { children: React.ReactNode }) {
  const { current } = useArtifacts();
  const isCanvasVisible = !!current;

  // @ts-ignore TODO: fix this
  const toastData = current?.payload?.toast;

  return (
    <>
      <div
        className={cn(
          "fixed top-[88px] right-4 w-[579px] z-30",
          "bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d]",
          "overflow-x-hidden overflow-y-auto transition-transform duration-300 ease-in-out",
          isCanvasVisible ? "translate-x-0" : "translate-x-[calc(100%+24px)]",
        )}
        style={{ height: "calc(100vh - 104px)" }}
      >
        <div className="h-full flex flex-col relative px-6 py-4">
          {children}

          {toastData && (
            <ProgressToast
              isVisible={toastData.visible}
              currentStep={toastData.currentStep}
              totalSteps={toastData.totalSteps}
              currentLabel={toastData.currentLabel}
              completed={toastData.completed}
              completedMessage={toastData.completedMessage}
            />
          )}
        </div>
      </div>
    </>
  );
}
