"use client";

import { Button } from "@midday/ui/button";
import { useQueryState } from "nuqs";

export function SyndicationsEmptyState() {
  const [, setCreateSyndicator] = useQueryState("createSyndicator");

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No syndicators</h2>
          <p className="text-[#606060] text-sm">
            You haven't added any syndication partners yet.
            <br />
            Add partners who co-fund deals with your business.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setCreateSyndicator("true")}
        >
          Add syndicator
        </Button>
      </div>
    </div>
  );
}

export function SyndicationsNoResults() {
  const [, setSearch] = useQueryState("q");

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button variant="outline" onClick={() => setSearch(null)}>
          Clear search
        </Button>
      </div>
    </div>
  );
}
