"use client";

import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FormatAmount } from "../format-amount";

export function SuggestedMatch() {
  const trpc = useTRPC();
  const { params } = useInboxParams();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();

  const id = params.inboxId;

  // Get the inbox data to check if it has status "suggested_match"
  const { data: inboxData } = useQuery(
    trpc.inbox.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
      },
    ),
  );

  // Extract suggestion from inbox data
  const suggestion = inboxData?.suggestion;

  // Type guard to check if suggestion has suggestedTransaction
  const hasSuggestedTransaction = (
    s: any,
  ): s is {
    suggestedTransaction: {
      name: string;
      date: string;
      amount: number;
      currency: string;
    };
  } => {
    return s && "suggestedTransaction" in s && s.suggestedTransaction;
  };

  const confirmMatchMutation = useMutation(
    trpc.inbox.confirmMatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.getById.queryKey({ id: id! }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.searchTransactionMatch.queryKey(),
        });
      },
    }),
  );

  const declineMatchMutation = useMutation(
    trpc.inbox.declineMatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.getById.queryKey({ id: id! }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const handleConfirm = () => {
    if (suggestion && id) {
      confirmMatchMutation.mutate({
        suggestionId: suggestion.id,
        inboxId: id,
        transactionId: suggestion.transactionId,
      });
    }
  };

  const handleDecline = () => {
    if (suggestion && id) {
      declineMatchMutation.mutate({
        suggestionId: suggestion.id,
        inboxId: id,
      });
    }
  };

  return (
    <motion.div
      key="suggested-match"
      initial={{ opacity: 0.7, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.7, y: 20 }}
      transition={{
        duration: 0.2,
        ease: [0.4, 0.0, 0.2, 1],
        exit: { duration: 0.15, ease: [0.4, 0.0, 1, 1] },
      }}
      className="backdrop-filter backdrop-blur-2xl bg-white/60 dark:bg-black/90 p-4 space-y-4 border dark:border-[#2C2C2C] border-[#DCDAD2]"
    >
      <div className="flex items-center">
        <span className="text-sm font-medium">Suggested Match</span>
        <div className="ml-auto text-xs text-muted-foreground">
          {suggestion && Math.round(suggestion.confidenceScore * 100)}%
          confidence
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm bg-muted/50 rounded py-3">
        <div className="flex gap-2 items-center">
          <span className="truncate font-medium">
            {hasSuggestedTransaction(suggestion)
              ? suggestion.suggestedTransaction.name
              : "Transaction"}
          </span>
          <span className="text-muted-foreground">
            {hasSuggestedTransaction(suggestion) &&
              formatDate(
                suggestion.suggestedTransaction.date,
                user?.dateFormat,
                true,
              )}
          </span>
        </div>
        <FormatAmount
          amount={
            hasSuggestedTransaction(suggestion)
              ? suggestion.suggestedTransaction.amount
              : 0
          }
          currency={
            hasSuggestedTransaction(suggestion)
              ? suggestion.suggestedTransaction.currency
              : "USD"
          }
        />
      </div>

      <div className="flex gap-2">
        <SubmitButton
          onClick={handleDecline}
          variant="outline"
          size="sm"
          isSubmitting={declineMatchMutation.isPending}
          className="w-full"
        >
          Decline
        </SubmitButton>
        <SubmitButton
          onClick={handleConfirm}
          size="sm"
          isSubmitting={confirmMatchMutation.isPending}
          className="w-full"
        >
          Confirm
        </SubmitButton>
      </div>
    </motion.div>
  );
}
