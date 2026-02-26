"use client";

import { SearchField } from "@/components/search-field";
import { useCollectionsFilterParams } from "@/hooks/use-collections-filter-params";
import { cn } from "@midday/ui/cn";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";

const tabStyle = cn(
  "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-[34px] min-h-[34px]",
  "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
  "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
);

export type CollectionsTab = "candidates" | "active" | "resolved";

export function CollectionsHeader() {
  const { filter, setFilter } = useCollectionsFilterParams();
  const tab = (filter.tab as CollectionsTab) || "active";

  const handleValueChange = (value: string) => {
    setFilter({
      tab: value,
      // Reset other filters when switching tabs
      stage: null,
      assignedTo: null,
      priority: null,
      q: null,
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={tab} onValueChange={handleValueChange}>
        <div className="relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] w-fit">
          <TabsList className="flex items-stretch h-auto p-0 bg-transparent">
            <TabsTrigger value="candidates" className={tabStyle}>
              Candidates
            </TabsTrigger>
            <TabsTrigger value="active" className={tabStyle}>
              Active
            </TabsTrigger>
            <TabsTrigger value="resolved" className={tabStyle}>
              Resolved
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <SearchField placeholder="Search collections" />
    </div>
  );
}
