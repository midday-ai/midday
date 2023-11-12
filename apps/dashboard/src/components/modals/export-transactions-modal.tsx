"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";

export function ExportTransactionsModal({ isOpen, setOpen }) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader className="mb-8">
            <DialogTitle>Export</DialogTitle>
            <DialogDescription>
              Heads up, we’ve noticed that 12 of your transactions are missing
              receipts. Click “show more” and we’ll filter them for you.
            </DialogDescription>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
