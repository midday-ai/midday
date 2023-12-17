"use client";

import { exportTransactionsAction } from "@/actions/export-transactions-action";
import { useExportStore } from "@/store/export";
import { Alert, AlertDescription } from "@midday/ui/alert";
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
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ExportTransactionsModal({
  isOpen,
  setOpen,
  totalMissingAttachments,
}) {
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

            {totalMissingAttachments && (
              <div className="pb-4">
                <Alert variant="warning">
                  <AlertDescription>
                    Heads up, we’ve noticed that {totalMissingAttachments} of
                    your transactions are missing attachments.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogDescription>
              You can share or download once completed then you can find it in
              your{" "}
              <Link
                href="/vault/exports"
                className="underline underline-offset-1"
              >
                exports
              </Link>{" "}
              folder.
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
