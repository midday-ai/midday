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

export function InboxConnectedEmpty() {
  return (
    <div className="h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="flex flex-col items-center max-w-[380px] text-center">
        <Icons.Inbox2 className="mb-4 size-12 text-[#606060]" />
        <h2 className="font-medium text-lg mb-2">No receipts found</h2>
        <p className="text-[#606060] text-sm mb-6">
          We scanned your last 30 days of emails for PDF attachments but didn't
          find any receipts or invoices yet. We'll automatically check for new
          ones several times per day.
        </p>
        <p className="text-[#878787] text-xs">
          You can also drag and drop files here to get started right away.
        </p>
      </div>
    </div>
  );
}
