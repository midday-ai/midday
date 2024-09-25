"use client";

import { useTransactionViewStore } from "@/store/transaction-view";
import { cn } from "@midday/ui/utils";
import { ListOrdered } from "lucide-react";

const TransactionViewAccessibilityButton: React.FC<{
  className?: string;
  isWidget?: boolean;
}> = ({ className, isWidget = false }) => {
  const { setOpen } = useTransactionViewStore();

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
        aria-label="Open transaction view"
      >
        <ListOrdered className="h-5 w-5" />
      </button>
    </div>
  );
};

export default TransactionViewAccessibilityButton;
