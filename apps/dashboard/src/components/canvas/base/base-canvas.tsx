"use client";

import { cn } from "@midday/ui/cn";

export function BaseCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "fixed top-[88px] right-4 w-[579px] z-30 scrollbar-hide overflow-y-auto",
        "bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d]",
        "overflow-x-hidden transition-transform duration-300 ease-in-out",
        "translate-x-0",
      )}
      style={{ height: "calc(100vh - 104px)" }}
    >
      <div className="h-full flex flex-col relative">{children}</div>
    </div>
  );
}
