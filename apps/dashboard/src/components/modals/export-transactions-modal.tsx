"use client";

import { exportTransactionsAction } from "@/actions/export-transactions-action";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hook";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ExportTransactionsModal({ isOpen, setOpen }) {
  const searchParams = useSearchParams();
  const { execute, status, result } = useAction(exportTransactionsAction);
  const filter = searchParams.get("filter");
  const date = filter ? JSON.parse(filter)?.date : null;
  const { toast } = useToast();

  useEffect(() => {
    if (status === "hasSucceeded" && isOpen) {
      setOpen(false);
    }
  }, [status]);

  useEffect(() => {
    if (result.data) {
      toast({
        duration: 6000,
        title: "Exporting...",
        description: "Your export is ready base on 46 transactions.",
        // action: (
        //   <ToastAction altText="Yes" onClick={handleUpdateSimilar}>
        //     Yes
        //   </ToastAction>
        // ),
      });
    }
  }, [result]);

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
