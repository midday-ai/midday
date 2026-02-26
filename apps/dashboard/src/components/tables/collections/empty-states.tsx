"use client";

import { useCollectionsFilterParams } from "@/hooks/use-collections-filter-params";
import { Button } from "@midday/ui/button";

export function EmptyState() {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No collection cases</h2>
          <p className="text-[#606060] text-sm">
            Deals that fall behind on payments will appear here as candidates.
            <br />
            Switch to the &quot;Candidates&quot; tab to see eligible deals.
          </p>
        </div>
      </div>
    </div>
  );
}

export function NoResults() {
  const { setFilter } = useCollectionsFilterParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setFilter({
              q: null,
              status: null,
              stage: null,
              assignedTo: null,
              priority: null,
              sort: null,
              tab: null,
            })
          }
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
