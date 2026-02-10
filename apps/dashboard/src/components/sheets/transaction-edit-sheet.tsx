"use client";

import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import { TransactionEditForm } from "../forms/transaction-edit-form";

export function TransactionEditSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { editTransaction, setParams } = useTransactionParams();

  const isOpen = Boolean(editTransaction);

  const { data: transaction } = useQuery({
    ...trpc.transactions.getById.queryOptions({ id: editTransaction! }),
    enabled: isOpen && Boolean(editTransaction),
    placeholderData: () => {
      const pages = queryClient
        .getQueriesData({ queryKey: trpc.transactions.get.infiniteQueryKey() })
        // @ts-expect-error
        .flatMap(([, data]) => data?.pages ?? [])
        .flatMap((page) => page.data ?? []);

      return pages.find((d) => d.id === editTransaction);
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams({ editTransaction: null });
    }
  };

  if (!transaction || !transaction.manual) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader className="mb-8">
          <SheetTitle>Edit Transaction</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-[50px]" hideScrollbar>
          <TransactionEditForm transaction={transaction} key={transaction.id} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
