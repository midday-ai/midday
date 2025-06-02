"use client";

import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";

export function TransactionShortcuts() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { transactionId } = useTransactionParams();

  const { data: transaction } = useQuery(
    trpc.transactions.getById.queryOptions(
      {
        id: transactionId!,
      },
      {
        enabled: !!transactionId,
      },
    ),
  );

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    }),
  );

  useHotkeys(
    "meta+m",
    (event) => {
      event.preventDefault();
      if (!transaction?.attachments || transaction.attachments.length === 0) {
        updateTransactionMutation.mutate({
          id: transactionId!,
          status: transaction?.status === "completed" ? "posted" : "completed",
        });
      }
    },
    { enabled: !!transactionId },
  );

  return (
    <div className="absolute bottom-4 right-4 left-4 bg-[#FAFAF9] dark:bg-[#121212]">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] h-6 flex items-center justify-center text-[#666] border border-border px-2">
            ⌘ M
          </span>
          <span className="text-[10px] text-[#666]">
            {transaction?.isFulfilled
              ? "Mark as uncompleted"
              : "Mark as completed"}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-border text-[#666]">
            <Icons.ArrowUpward className="size-3.5" />
          </div>

          <div className="flex h-6 w-6 items-center justify-center border border-border text-[#666]">
            <Icons.ArrowDownward className="size-3.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] h-6 flex items-center justify-center text-[#666] border border-border px-2">
              Esc
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
