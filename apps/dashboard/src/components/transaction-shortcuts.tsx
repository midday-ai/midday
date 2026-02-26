"use client";

import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";

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

  const canToggleReviewReady =
    !!transaction &&
    (!transaction.attachments || transaction.attachments.length === 0) &&
    transaction.status !== "excluded" &&
    transaction.status !== "archived";

  const isReviewReadyFromStatus = transaction?.status === "completed";

  useHotkeys(
    "meta+m",
    (event) => {
      event.preventDefault();
      if (canToggleReviewReady) {
        updateTransactionMutation.mutate({
          id: transactionId!,
          status: isReviewReadyFromStatus ? "posted" : "completed",
        });
      }
    },
    { enabled: !!transactionId },
  );

  return (
    <div className="absolute bottom-4 right-4 left-4 bg-[#FAFAF9] dark:bg-[#0C0C0C]">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] h-6 flex items-center justify-center text-[#666] border border-border px-2">
            ⌘ M
          </span>
          <span className="text-[10px] text-[#666]">
            {isReviewReadyFromStatus ? "Unmark ready" : "Mark ready"}
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
