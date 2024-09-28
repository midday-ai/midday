"use client";

import { useOverviewViewStore } from "@/store/overview-view";
import { cn } from "@midday/ui/utils";
import { LayoutDashboard } from "lucide-react";

const OverviewViewAccessibilityButton: React.FC<{
  className?: string;
  isWidget?: boolean;
}> = ({ className, isWidget = false }) => {
  const { setOpen } = useOverviewViewStore();

  return (
    <div
      className={cn(
        isWidget && "fixed bottom-0 m-4 hidden sm:block",
        className,
      )}
    >
      <button
        className="inline-flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => setOpen(true)}
        style={
          isWidget
            ? {
                marginRight:
                  "calc(20px + var(--removed-body-scroll-bar-size, 0px))",
              }
            : undefined
        }
        aria-label="Open overview"
      >
        <LayoutDashboard className="h-5 w-5" strokeWidth={0.5} />
      </button>
    </div>
  );
};

export default OverviewViewAccessibilityButton;
