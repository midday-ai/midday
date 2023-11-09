"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";

export function NoResults({ hasFilters }) {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Transactions2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            {hasFilters
              ? "Try another search, or adjusting the filters"
              : "There are no transactions imported yet"}
          </p>
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            onClick={() => router.push("/transactions")}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
