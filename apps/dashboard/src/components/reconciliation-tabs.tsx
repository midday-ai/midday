"use client";

import { useReconciliationFilterParams } from "@/hooks/use-reconciliation-filter-params";
import { cn } from "@midday/ui/cn";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";

const tabStyle = cn(
  "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-[34px] min-h-[34px]",
  "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
  "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
);

export type ReconciliationTab = "feed" | "reconcile" | "discrepancies";

export function ReconciliationTabs() {
  const { filter, setFilter } = useReconciliationFilterParams();
  const tab = (filter.tab as ReconciliationTab) || "feed";

  const handleValueChange = (value: string) => {
    setFilter({ tab: value });
  };

  return (
    <Tabs value={tab} onValueChange={handleValueChange}>
      <div className="relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] w-fit">
        <TabsList className="flex items-stretch h-auto p-0 bg-transparent">
          <TabsTrigger value="feed" className={tabStyle}>
            Payment Feed
          </TabsTrigger>
          <TabsTrigger value="reconcile" className={tabStyle}>
            Reconcile
          </TabsTrigger>
          <TabsTrigger value="discrepancies" className={tabStyle}>
            Discrepancies
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
