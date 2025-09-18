"use client";

import { useCanvasState } from "@/hooks/use-canvas-state";
import { cn } from "@midday/ui/cn";

export function BaseCanvas({ children }: { children: React.ReactNode }) {
  const { isVisible: isCanvasVisible } = useCanvasState();

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
        </div>
      </div>
    </>
  );
}
