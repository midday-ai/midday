"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { FormatAmount } from "@/components/format-amount";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { useState } from "react";

type Transaction = RouterOutputs["transactions"]["get"]["data"][number];

type Props = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: { nsfFee?: number; note?: string }) => void;
  isPending: boolean;
};

export function MarkNsfDialog({
  transaction,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  const [nsfFee, setNsfFee] = useState("");
  const [note, setNote] = useState("");

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setNsfFee("");
      setNote("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    onConfirm({
      nsfFee: nsfFee ? Number.parseFloat(nsfFee) : undefined,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as NSF</DialogTitle>
          <DialogDescription>
            Flag this transaction as a returned/bounced payment (Non-Sufficient
            Funds).
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-md border p-3 bg-destructive/5 text-sm space-y-1">
            <div className="font-medium">{transaction.name}</div>
            <div className="text-muted-foreground flex items-center gap-2">
              <FormatAmount
                amount={transaction.amount}
                currency={transaction.currency}
              />
              <span>&middot;</span>
              <span>{transaction.date}</span>
            </div>
            {transaction.dealCode && (
              <div className="text-xs text-muted-foreground">
                Deal: <span className="font-mono">{transaction.dealCode}</span>
                {transaction.dealMerchantName && (
                  <> &middot; {transaction.dealMerchantName}</>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nsf-fee">NSF Fee (optional)</Label>
            <Input
              id="nsf-fee"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 35.00"
              value={nsfFee}
              onChange={(e) => setNsfFee(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nsf-note">Note (optional)</Label>
            <Textarea
              id="nsf-note"
              placeholder="Reason or additional context..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Marking..." : "Mark as NSF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
