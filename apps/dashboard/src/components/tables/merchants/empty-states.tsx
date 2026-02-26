"use client";

import { useMerchantParams } from "@/hooks/use-merchant-params";
import { Button } from "@midday/ui/button";

export function EmptyState() {
  const { setParams } = useMerchantParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No merchants</h2>
          <p className="text-[#606060] text-sm">
            You haven't added any merchants yet. <br />
            Go ahead and add your first one.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setParams({
              createMerchant: true,
            })
          }
        >
          Add merchant
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  const { setParams } = useMerchantParams();

  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button variant="outline" onClick={() => setParams(null)}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
