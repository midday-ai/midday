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
import { formatISO } from "date-fns";
import { useState } from "react";
import { SyncPeriodPicker } from "./sync-period-picker";

interface SyncPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: (syncStartDate: string) => void;
  isSyncing: boolean;
}

export function SyncPeriodDialog({
  open,
  onOpenChange,
  onSync,
  isSyncing,
}: SyncPeriodDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleSync = () => {
    if (selectedDate) {
      onSync(formatISO(selectedDate, { representation: "date" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Sync inbox</DialogTitle>
            <DialogDescription>
              Choose a time range to scan for receipts and invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4">
            <SyncPeriodPicker onDateChange={setSelectedDate} />
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={handleSync} disabled={!selectedDate || isSyncing}>
              {isSyncing ? "Syncing..." : "Start sync"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
