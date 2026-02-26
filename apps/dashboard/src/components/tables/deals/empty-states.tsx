"use client";

import { useDealFilterParams } from "@/hooks/use-deal-filter-params";
import { useDealParams } from "@/hooks/use-deal-params";
import { Button } from "@midday/ui/button";

export function EmptyState() {
  const { setParams } = useDealParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No deals</h2>
          <p className="text-[#606060] text-sm">
            You haven't created any deals yet. <br />
            Go ahead and create your first one.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setParams({
              type: "create",
            })
          }
        >
          Create deal
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  const { setFilter } = useDealFilterParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button variant="outline" onClick={() => setFilter(null)}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
