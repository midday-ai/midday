"use client";

import { Button } from "@midday/ui/button";
import { useQueryState } from "nuqs";

export function BrokersEmptyState() {
  const [, setCreateBroker] = useQueryState("createBroker");

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No brokers</h2>
          <p className="text-[#606060] text-sm">
            You haven't added any brokers (ISOs) yet.
            <br />
            Add brokers who originate deals for your business.
          </p>
        </div>

        <Button variant="outline" onClick={() => setCreateBroker("true")}>
          Add broker
        </Button>
      </div>
    </div>
  );
}

export function BrokersNoResults() {
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
