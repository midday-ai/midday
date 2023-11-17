"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";

export function ExportTransactionsModal({ isOpen, setOpen }) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <div className="p-6">
          <DialogHeader className="mb-8">
            <DialogTitle>Export</DialogTitle>
            <DialogDescription>
              Heads up, we’ve noticed that 12 of your transactions are missing
              receipts. Click “show more” and we’ll filter them for you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>Export</Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
