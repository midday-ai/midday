"use client";

import { CopyInput } from "@/components/copy-input";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useUserQuery } from "@/hooks/use-user";
import { getInboxEmail } from "@midday/inbox";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function InboxEmpty() {
  const { data: user } = useUserQuery();

  return (
    <div className="h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="flex flex-col items-center max-w-[380px] w-full">
        <Icons.InboxEmpty className="mb-4 w-[35px] h-[35px]" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Magic Inbox</h2>
          <p className="text-[#606060] text-sm">
            Use the email to send receipts to Midday. We will extract and
            reconcile them against your transactions. Additionally, you can also
            upload receipts by simply dragging and dropping them here.
            <br />
          </p>
        </div>

        {user?.team?.inbox_id && (
          <CopyInput value={getInboxEmail(user.team.inbox_id)} />
        )}
      </div>
    </div>
  );
}

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

        <Button variant="outline" onClick={() => setParams({ q: null })}>
          Clear search
        </Button>
      </div>
    </div>
  );
}
