"use client";

import { cn } from "@midday/ui/cn";

export function BaseCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "fixed z-30 scrollbar-hide overflow-y-auto",
        "bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d]",
        "overflow-x-hidden transition-transform duration-300 ease-in-out",
        "translate-x-0",
        "top-[88px] bottom-0 left-0 right-0",
        "md:inset-x-auto md:right-4 md:w-[579px] md:bottom-auto",
      )}
      style={{ height: "calc(100vh - 88px)" }}
    >
      <div className="h-full flex flex-col relative">{children}</div>
    </div>
  );
}
