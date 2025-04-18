"use client";

import { useTrackerFilterParams } from "@/hooks/use-tracker-filter-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Button } from "@midday/ui/button";

export function EmptyState() {
  const { setParams } = useTrackerParams();

  return (
    <div className="flex items-center justify-center h-[350px]">
      <div className="flex flex-col items-center -mt-20">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No projects</h2>
          <p className="text-[#606060] text-sm">
            You haven't created any projects yet. <br />
            Go ahead and create your first one.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setParams({
              create: true,
            })
          }
        >
          Create project
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  const { setFilter } = useTrackerFilterParams();

  return (
    <div className="flex items-center justify-center h-[350px]">
      <div className="flex flex-col items-center -mt-20">
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
