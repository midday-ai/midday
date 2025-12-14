"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { ConnectGmail } from "./connect-gmail";
import { ConnectOutlook } from "./connect-outlook";

type ConnectEmailModalProps = {
  children: React.ReactNode;
};

export function ConnectEmailModal({ children }: ConnectEmailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
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
