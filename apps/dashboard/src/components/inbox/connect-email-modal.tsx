"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { useState } from "react";
import { ConnectGmail } from "./connect-gmail";
import { ConnectOutlook } from "./connect-outlook";

type ConnectEmailModalProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConnectEmailModal({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ConnectEmailModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[400px]" hideClose>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect email</DialogTitle>
            <DialogDescription>
              Choose your email provider to automatically import receipts and
              invoices from your inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-3 pt-4">
            <ConnectGmail />
            <ConnectOutlook />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
