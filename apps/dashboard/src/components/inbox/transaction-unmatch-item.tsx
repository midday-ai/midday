"use client";

import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TransactionMatchItem } from "./transaction-match-item";

export function TransactionUnmatchItem() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { params } = useInboxParams();
  const { data: user } = useUserQuery();

  const id = params.inboxId;

  const { data } = useQuery(
    trpc.inbox.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
      },
    ),
  );

  const unmatchTransactionMutation = useMutation(
    trpc.inbox.unmatchTransaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.searchTransactionMatch.queryKey({
            inboxId: id ?? undefined,
          }),
        });
      },
      onMutate: async (variables) => {
        const { id } = variables;
        const queryKey = trpc.inbox.getById.queryKey({ id });

        await queryClient.cancelQueries({ queryKey });

        const previousInboxItem = queryClient.getQueryData(queryKey);

        if (previousInboxItem) {
          queryClient.setQueryData(queryKey, {
            ...previousInboxItem,
            transaction_id: null,
            transaction: null,
          });
        }

        return { previousInboxItem };
      },
      onError: (_, variables, context) => {
        if (context?.previousInboxItem) {
          queryClient.setQueryData(
            trpc.inbox.getById.queryKey({ id: variables.id }),
            context.previousInboxItem,
          );
        }
      },
      onSettled: (_, __, variables) => {
        queryClient.invalidateQueries({
          queryKey: [
            trpc.inbox.getById.queryKey({ id: variables.id }),
            trpc.inbox.get.infiniteQueryKey(),
          ],
        });
      },
    }),
  );

  if (!data?.transaction) {
    return null;
  }

  return (
    <div className="bg-background h-12 flex py-3 text-sm w-full px-4 gap-4 items-center overflow-hidden">
      <Icons.Check className="w-4 h-4" />

      <TransactionMatchItem
        date={data?.transaction?.date}
        name={data?.transaction?.name}
        dateFormat={user?.date_format}
        amount={data?.transaction?.amount}
        currency={data?.transaction?.currency}
      />

      <button
        onClick={() => unmatchTransactionMutation.mutate({ id: id! })}
        type="button"
      >
        <Icons.Delete className="w-4 h-4 text-[#878787]" />
      </button>
    </div>
  );
}
