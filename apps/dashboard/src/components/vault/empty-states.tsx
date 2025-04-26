"use client";

import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { VaultGridSkeleton } from "./vault-grid-skeleton";

export function NoResults() {
  const { setFilter } = useDocumentFilterParams();

  return (
    <div className="h-screen w-full flex items-center justify-center flex-col">
      <div className="flex flex-col items-center -mt-[160px]">
        <Icons.Transactions2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">Try another search term</p>
        </div>

        <Button variant="outline" onClick={() => setFilter(null)}>
          Clear search
        </Button>
      </div>
    </div>
  );
}
