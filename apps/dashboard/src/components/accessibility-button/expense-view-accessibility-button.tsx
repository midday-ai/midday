"use client";

import { useExpenseViewStore } from "@/store/expense-view";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import { ChartBarDecreasing } from "lucide-react";

const ExpenseViewAccessibilityButton: React.FC<{
  className?: string;
  isWidget?: boolean;
  title?: string;
}> = ({ className, isWidget = false, title }) => {
  const { setOpen } = useExpenseViewStore();

  return (
    <Button
      variant="ghost"
      className="flex flex-1 items-center gap-2 border-0 w-full justify-start"
      onClick={() => setOpen(true)}
    >
      <div
        className={cn(
          isWidget && "fixed bottom-0 m-4 hidden sm:block",
          className,
        )}
      >
        <button
          className="inline-flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          style={
            isWidget
              ? {
                marginRight:
                  "calc(20px + var(--removed-body-scroll-bar-size, 0px))",
              }
              : undefined
          }
          aria-label="Open income view"
        >
          <ChartBarDecreasing className="h-5 w-5" strokeWidth={0.5} />
        </button>
      </div>
      {title && <span className="text-lg">{title}</span>}
    </Button>
  );
};

export default ExpenseViewAccessibilityButton;
