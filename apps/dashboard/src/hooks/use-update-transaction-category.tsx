"use client";

import { ToastAction } from "@midday/ui/toast";
import { toast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInvalidateTransactionQueries } from "@/hooks/use-invalidate-transaction-queries";
import { useTRPC } from "@/trpc/client";

type Category = {
  id?: string;
  name: string;
  slug: string;
};

type UseUpdateTransactionCategoryOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useUpdateTransactionCategory(
  options?: UseUpdateTransactionCategoryOptions,
) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateTransactionQueries = useInvalidateTransactionQueries();

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey(),
        });

        // If category changed, invalidate reports and widgets
        if ("categorySlug" in variables) {
          invalidateTransactionQueries();
        }

        options?.onSuccess?.();
      },
      onError: options?.onError,
    }),
  );

  const updateTransactionsMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey(),
        });

        // If category changed, invalidate reports and widgets
        if ("categorySlug" in variables) {
          invalidateTransactionQueries();
        }
      },
    }),
  );

  const updateCategory = async (
    transactionId: string,
    transactionName: string,
    category: Category,
  ) => {
    // Update the transaction first
    await updateTransactionMutation.mutateAsync({
      id: transactionId,
      categorySlug: category.slug,
    });

    // Check for similar transactions
    const similarTransactions = await queryClient.fetchQuery(
      trpc.transactions.getSimilarTransactions.queryOptions({
        transactionId,
        name: transactionName,
        categorySlug: category.slug,
      }),
    );

    // Show prompt if similar transactions found
    if (similarTransactions?.length && similarTransactions.length > 0) {
      toast({
        duration: 6000,
        variant: "ai",
        title: "Midday AI",
        description: `We found ${similarTransactions.length} similar transactions to "${transactionName}". Mark them as ${category.name} too?`,
        footer: (
          <div className="flex space-x-2 mt-4">
            <ToastAction altText="Cancel" className="pl-5 pr-5">
              Cancel
            </ToastAction>
            <ToastAction
              altText="Yes"
              onClick={() => {
                const similarTransactionIds = similarTransactions.map(
                  (t) => t.id,
                );
                updateTransactionsMutation.mutate({
                  ids: similarTransactionIds,
                  categorySlug: category.slug,
                });
              }}
              className="pl-5 pr-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Yes
            </ToastAction>
          </div>
        ),
      });
    }
  };

  return {
    updateCategory,
    isUpdating: updateTransactionMutation.isPending,
    isUpdatingSimilar: updateTransactionsMutation.isPending,
  };
}
