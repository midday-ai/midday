"use client";

import { cn } from "@midday/ui/cn";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useEffect, useState } from "react";
import { useReviewTransactions } from "@/hooks/use-review-transactions";
import { useTransactionTab } from "@/hooks/use-transaction-tab";

function ReviewCount() {
  const { transactionIds } = useReviewTransactions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || transactionIds.length === 0) {
    return null;
  }

  return (
    <span className="ml-1 text-xs text-[#878787]">
      ({transactionIds.length})
    </span>
  );
}

export function TransactionTabs() {
  const { tab, setTab } = useTransactionTab();

  const handleValueChange = (value: string) => {
    if (value === "all" || value === "review") {
      setTab(value);
    }
  };

  return (
    <Tabs value={tab} onValueChange={handleValueChange}>
      <div className="relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] w-fit">
        <TabsList className="flex items-stretch h-auto p-0 bg-transparent">
          <TabsTrigger
            value="all"
            className={cn(
              "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-[34px] min-h-[34px]",
              "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
              "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
            )}
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className={cn(
              "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-[34px] min-h-[34px]",
              "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
              "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
            )}
          >
            Review
            <ReviewCount />
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
