"use client";

import { exportTransactionsAction } from "@/actions/export-transactions-action";
import { useExportStore } from "@/store/export";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hook";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ExportTransactionsModal({ isOpen, setOpen }) {
  const searchParams = useSearchParams();
  const { setExportId } = useExportStore();
  const filter = searchParams.get("filter");
  const date = filter ? JSON.parse(filter)?.date : null;

  const { execute, status } = useAction(exportTransactionsAction, {
    onSuccess: ({ id }) => {
      setExportId(id);
    },
  });

  useEffect(() => {
    if (status === "hasSucceeded" && isOpen) {
      setOpen(false);
    }
  }, [status]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-[455px]">
        <div className="p-6">
          <DialogHeader className="mb-8">
            <DialogTitle>Export</DialogTitle>
            <DialogDescription>
              Heads up, we’ve noticed that 12 of your transactions are missing
              receipts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => execute(date)}
                disabled={status === "executing"}
              >
                {status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Export"
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
