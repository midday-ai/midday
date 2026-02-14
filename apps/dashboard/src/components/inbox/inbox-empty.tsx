"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";

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

        <Button
          variant="outline"
          onClick={() => setParams({ q: null, status: null })}
        >
          Clear search
        </Button>
      </div>
    </div>
  );
}

export function InboxConnectedEmpty() {
  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Inbox2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            We'll automatically check for new
            <br />
            receipts several times per day
          </p>
        </div>
      </div>
    </div>
  );
}

export function InboxOtherEmpty() {
  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Inbox2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No other documents</h2>
          <p className="text-[#606060] text-sm">
            Non-financial documents from your
            <br />
            connected accounts will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
