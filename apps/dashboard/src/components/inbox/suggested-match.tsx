"use client";

import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { formatDate } from "@midday/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { LocalStorageKeys } from "@/utils/constants";
import { FormatAmount } from "../format-amount";

export function SuggestedMatch() {
  const trpc = useTRPC();
  const { params } = useInboxParams();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasSeenLearningToast, setHasSeenLearningToast] = useLocalStorage(
    LocalStorageKeys.MatchLearningToastSeen,
    false,
  );

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

        showLearningToast();
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

        showLearningToast();
      },
    }),
  );

  const showLearningToast = () => {
    if (!hasSeenLearningToast) {
      toast({
        title: "Midday AI",
        description: "We learn from your choices to improve matches over time.",
        variant: "ai",
        duration: 5000,
      });
      setHasSeenLearningToast(true);
    }
  };

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
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white/95 dark:bg-black/95 p-4 space-y-4 border dark:border-[#2C2C2C] border-[#DCDAD2] shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 text-sm bg-muted/50">
        <div className="flex flex-col gap-2">
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
                )}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {suggestion && Math.round(suggestion.confidenceScore * 100)}%
            confidence
          </div>
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
