"use client";

import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";

export function TransactionShortcuts() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { transactionId, setParams } = useTransactionParams();
  const transactionIds = useTransactionsStore((s) => s.transactionIds);

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
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.transactions.getById.queryKey({
              id: transactionId!,
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);
      },
    }),
  );

  const canToggleReviewReady =
    !!transaction &&
    (!transaction.attachments || transaction.attachments.length === 0) &&
    transaction.status !== "excluded" &&
    transaction.status !== "archived";

  const isReviewReadyFromStatus = transaction?.status === "completed";

  const toggleReviewReady = async () => {
    if (!canToggleReviewReady || !transactionId) return;

    const currentIndex = transactionIds.indexOf(transactionId);
    const adjacentId =
      currentIndex !== -1
        ? (transactionIds[currentIndex + 1] ?? transactionIds[currentIndex - 1])
        : undefined;

    await updateTransactionMutation.mutateAsync({
      id: transactionId,
      status: isReviewReadyFromStatus ? "posted" : "completed",
    });

    const updatedIds = useTransactionsStore.getState().transactionIds;
    if (!updatedIds.includes(transactionId)) {
      setParams(adjacentId ? { transactionId: adjacentId } : null);
    }
  };

  useHotkeys(
    "meta+m",
    (event) => {
      event.preventDefault();
      toggleReviewReady();
    },
    { enabled: !!transactionId },
  );

  const navigate = (direction: "up" | "down") => {
    if (!transactionId) return;
    const currentIndex = transactionIds.indexOf(transactionId);
    if (currentIndex === -1) return;
    const nextId = transactionIds[currentIndex + (direction === "up" ? -1 : 1)];
    if (nextId) {
      setParams({ transactionId: nextId });
    }
  };

  return (
    <div className="absolute bottom-4 right-4 left-4 bg-[#FAFAF9] dark:bg-[#0C0C0C]">
      <div className="flex justify-between">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={toggleReviewReady}
          disabled={!canToggleReviewReady}
        >
          <span className="text-[10px] h-6 flex items-center justify-center text-[#666] border border-border px-2">
            ⌘ M
          </span>
          <span className="text-[10px] text-[#666]">
            {isReviewReadyFromStatus ? "Unmark ready" : "Mark ready"}
          </span>
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center border border-border text-[#666] cursor-pointer hover:bg-accent"
            onClick={() => navigate("up")}
          >
            <Icons.ArrowUpward className="size-3.5" />
          </button>

          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center border border-border text-[#666] cursor-pointer hover:bg-accent"
            onClick={() => navigate("down")}
          >
            <Icons.ArrowDownward className="size-3.5" />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setParams(null)}
          >
            <span className="text-[10px] h-6 flex items-center justify-center text-[#666] border border-border px-2 hover:bg-accent">
              Esc
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
