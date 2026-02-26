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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import { useState } from "react";

type Transaction = RouterOutputs["transactions"]["get"]["data"][number];

const PAYMENT_TYPES = [
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "check", label: "Check" },
  { value: "manual", label: "Manual" },
  { value: "other", label: "Other" },
] as const;

type Props = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: {
    amount: number;
    paymentDate: string;
    paymentType: string;
    note?: string;
  }) => void;
  isPending: boolean;
};

export function RecordCollectionDialog({
  transaction,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentType, setPaymentType] = useState("ach");
  const [note, setNote] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && transaction) {
      setAmount(Math.abs(transaction.amount).toString());
      setPaymentDate(transaction.date);
    }
    if (!isOpen) {
      setAmount("");
      setPaymentDate("");
      setPaymentType("ach");
      setNote("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!parsedAmount || !paymentDate) return;

    onConfirm({
      amount: parsedAmount,
      paymentDate,
      paymentType,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Collection</DialogTitle>
          <DialogDescription>
            Record a payment against the matched deal.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1">
            <div className="font-medium">{transaction.name}</div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="collection-amount">Amount</Label>
              <Input
                id="collection-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-date">Payment Date</Label>
              <Input
                id="collection-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-type">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger id="payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-note">Note (optional)</Label>
            <Textarea
              id="collection-note"
              placeholder="Additional context..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !amount || !paymentDate}
          >
            {isPending ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
