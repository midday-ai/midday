"use client";

import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function NoResults() {
  const { setParams } = useInboxFilterParams();

  return (
    <div className="h-screen -mt-[140px] w-full flex items-center justify-center flex-col">
      <div className="flex flex-col items-center">
        <Icons.Transactions2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">Try another search term</p>
        </div>

        <Button variant="outline" onClick={() => setParams(null)}>
          Clear search
        </Button>
      </div>
    </div>
  );
}
