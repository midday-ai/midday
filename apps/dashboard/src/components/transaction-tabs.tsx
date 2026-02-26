"use client";

import { useReviewTransactions } from "@/hooks/use-review-transactions";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useQuery } from "@tanstack/react-query";

const tabStyle = cn(
  "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-[34px] min-h-[34px]",
  "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
  "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
);

export function TransactionTabs() {
  const trpc = useTRPC();
  const { tab, setTab } = useTransactionTab();
  const { transactionIds } = useReviewTransactions();
  const reviewCount = transactionIds.length;
  const { data: syndicationCount } = useQuery(
    trpc.syndication.getTeamTransactionCount.queryOptions(),
  );

  const handleValueChange = (value: string) => {
    if (value === "all" || value === "review" || value === "syndication") {
      setTab(value);
    }
  };

  return (
    <Tabs value={tab} onValueChange={handleValueChange}>
      <div className="relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] w-fit">
        <TabsList className="flex items-stretch h-auto p-0 bg-transparent">
          <TabsTrigger value="all" className={tabStyle}>
            All
          </TabsTrigger>
          <TabsTrigger value="review" className={tabStyle}>
            Review
            {reviewCount > 0 && (
              <span className="ml-1 text-xs text-[#878787]">
                ({reviewCount})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="syndication" className={tabStyle}>
            Syndication
            {syndicationCount && syndicationCount.count > 0 && (
              <span className="ml-1 text-xs text-[#878787]">
                ({syndicationCount.count})
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
