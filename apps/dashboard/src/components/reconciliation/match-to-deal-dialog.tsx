"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { FormatAmount } from "@/components/format-amount";
import { Textarea } from "@midday/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Transaction = RouterOutputs["transactions"]["get"]["data"][number];

type Props = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dealId: string, note?: string) => void;
  isPending: boolean;
};

export function MatchToDealDialog({
  transaction,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  const trpc = useTRPC();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const { data: dealsData } = useQuery(
    trpc.mcaDeals.list.queryOptions(
      { status: "active", pageSize: 100 },
      { enabled: open },
    ),
  );

  const deals = dealsData?.data ?? [];

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedDealId(null);
      setNote("");
      setSearch("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    if (!selectedDealId) return;
    onConfirm(selectedDealId, note || undefined);
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Match to Deal</DialogTitle>
          <DialogDescription>
            Link this transaction to an MCA deal for reconciliation.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1">
            <div className="font-medium">{transaction.name}</div>
            <div className="text-muted-foreground flex items-center gap-2">
              <FormatAmount
                amount={transaction.amount}
                currency={transaction.currency}
              />
              <span>&middot;</span>
              <span>{transaction.date}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Command className="rounded-md border" shouldFilter={false}>
            <CommandInput
              placeholder="Search deals by code or merchant..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-48">
              <CommandEmpty>No active deals found.</CommandEmpty>
              <CommandGroup>
                {deals
                  .filter(
                    (deal) =>
                      !search ||
                      deal.dealCode
                        ?.toLowerCase()
                        .includes(search.toLowerCase()) ||
                      deal.merchantName
                        ?.toLowerCase()
                        .includes(search.toLowerCase()),
                  )
                  .map((deal) => (
                    <CommandItem
                      key={deal.id}
                      value={deal.id}
                      onSelect={() => setSelectedDealId(deal.id)}
                      className={
                        selectedDealId === deal.id
                          ? "bg-accent"
                          : undefined
                      }
                    >
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-medium font-mono text-xs">
                            {deal.dealCode}
                          </span>
                          {deal.currentBalance != null && (
                            <span className="text-xs text-muted-foreground">
                              Bal:{" "}
                              <FormatAmount
                                amount={deal.currentBalance}
                                currency="USD"
                              />
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {deal.merchantName}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {selectedDeal && (
            <div className="rounded-md border p-3 bg-primary/5 text-sm space-y-1">
              <div className="font-medium font-mono">{selectedDeal.dealCode}</div>
              <div className="text-muted-foreground text-xs">
                {selectedDeal.merchantName} &middot; Daily:{" "}
                {selectedDeal.dailyPayment != null && (
                  <FormatAmount
                    amount={selectedDeal.dailyPayment}
                    currency="USD"
                  />
                )}
              </div>
            </div>
          )}

          <Textarea
            placeholder="Add a note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
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
            onClick={handleConfirm}
            disabled={isPending || !selectedDealId}
          >
            {isPending ? "Matching..." : "Match to Deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
