"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { formatISO } from "date-fns";
import { useState } from "react";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { SyncPeriodPicker } from "./sync-period-picker";

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
          <h2 className="font-medium text-lg">No receipts found</h2>
          <p className="text-[#606060] text-sm">
            We didn't find any receipts or invoices
            <br />
            for this period. Try selecting a longer time range.
          </p>
        </div>
      </div>
    </div>
  );
}

interface InboxSelectPeriodProps {
  onSync: (syncStartDate: string) => void;
  isSyncing: boolean;
}

export function InboxSelectPeriod({
  onSync,
  isSyncing,
}: InboxSelectPeriodProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleSync = () => {
    if (selectedDate) {
      onSync(formatISO(selectedDate, { representation: "date" }));
    }
  };

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Inbox2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Import receipts</h2>
          <p className="text-[#606060] text-sm">
            Select how far back you'd like us to look for
            <br />
            receipts and invoices. We'll keep checking
            <br />
            for new ones automatically.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <SyncPeriodPicker onDateChange={setSelectedDate} />
          <Button onClick={handleSync} disabled={!selectedDate || isSyncing}>
            {isSyncing ? "Importing..." : "Start import"}
          </Button>
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
