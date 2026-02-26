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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { useState } from "react";

type Transaction = RouterOutputs["transactions"]["get"]["data"][number];

const ESCALATION_STATUSES = [
  { value: "late", label: "Late" },
  { value: "in_collections", label: "In Collections" },
] as const;

type Props = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: { status: string; note?: string }) => void;
  isPending: boolean;
};

export function EscalateDialog({
  transaction,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  const [status, setStatus] = useState<string>("late");
  const [note, setNote] = useState("");

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStatus("late");
      setNote("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    onConfirm({
      status,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escalate to Collections</DialogTitle>
          <DialogDescription>
            Change the deal status to flag it for collection action.
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
            <Label htmlFor="escalation-status">Escalation Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="escalation-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESCALATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="escalation-note">Note (optional)</Label>
            <Textarea
              id="escalation-note"
              placeholder="Reason for escalation..."
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
            {isPending ? "Escalating..." : "Escalate Deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
