"use client";

import { useUserQuery } from "@/hooks/use-user";
import { getInboxEmail } from "@midday/inbox";
import { Button } from "@midday/ui/button";
import {
  DialogContent,
  // DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Dialog } from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";
import { CopyInput } from "../copy-input";
// import { ConnectGmail } from "../inbox/connect-gmail";
// import { ConnectOutlook } from "../inbox/connect-outlook";
// import { InboxConnectedAccounts } from "../inbox/inbox-connected-accounts";

export function InboxSettingsModal() {
  const [open, setOpen] = useState(false);
  const { data: user } = useUserQuery();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
          <Icons.InboxCustomize />
        </Button>
      </div>

      <DialogContent
        className="max-w-[455px]"
        onOpenAutoFocus={(evt) => evt.preventDefault()}
      >
        <div className="p-4">
          <DialogHeader className="mb-4">
            <DialogTitle>Settings</DialogTitle>
            {/* <DialogDescription>
              Connect your email provider or forward emails to your Midday
              address to. Midday will find attachments and suggest transactions
              to match them with.
            </DialogDescription> */}
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Inbox email</span>
            {user?.team?.inboxId && (
              <CopyInput value={getInboxEmail(user.team.inboxId)} />
            )}
          </div>

          {/* <InboxConnectedAccounts /> */}

          <div className="flex flex-col gap-2 mt-6">
            {/* <ConnectGmail /> */}
            {/* <ConnectOutlook /> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
