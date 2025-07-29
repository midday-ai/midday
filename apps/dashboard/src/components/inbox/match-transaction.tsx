"use client";

import { useInboxParams } from "@/hooks/use-inbox-params";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Combobox } from "@midday/ui/combobox";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { TransactionMatchItem } from "./transaction-match-item";
import { TransactionUnmatchItem } from "./transaction-unmatch-item";

export function MatchTransaction() {
  const trpc = useTRPC();
  const { params } = useInboxParams();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();

  const [debouncedValue, setValue] = useDebounceValue("", 200);
  const [isOpen, onOpenChange] = useState(false);
  const [includeAlreadyMatched, setIncludeAlreadyMatched] = useLocalStorage(
    "inbox-include-already-matched",
    true,
  );

  const id = params.inboxId;

  const { data } = useQuery(
    trpc.inbox.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
      },
    ),
  );

  const { data: transactionMatch, isLoading } = useQuery(
    trpc.transactions.searchTransactionMatch.queryOptions({
      query: debouncedValue,
      inboxId: id ?? undefined,
      maxResults: debouncedValue.length > 0 ? 200 : 3,
      includeAlreadyMatched,
    }),
  );

  const isSearching = isLoading && debouncedValue.length > 0;

  const options = transactionMatch?.map((transaction, index) => ({
    id: transaction.transaction_id,
    name: transaction.name,
    component: () => (
      <TransactionMatchItem
        date={transaction.transaction_date}
        name={transaction.name}
        dateFormat={user?.dateFormat}
        amount={transaction.transaction_amount}
        currency={transaction.transaction_currency}
        isAlreadyMatched={transaction.is_already_matched}
        matchedAttachmentFilename={transaction.matched_attachment_filename}
        showBestMatch={
          index === 0 && transactionMatch?.length > 1 && !debouncedValue.length
        }
      />
    ),
  }));

  const selectedOptionBase = data?.transaction
    ? { id: data.transaction.id, name: data.transaction.name }
    : options?.find((option) => option.id === debouncedValue);

  const selectedValue = selectedOptionBase
    ? { id: selectedOptionBase.id, name: selectedOptionBase.name }
    : undefined;

  const handleChange = (value: string) => {
    setValue(value);
  };

  const handleFocus = () => {
    if (options && options.length > 0) {
      onOpenChange(true);
    }
  };

  const toggleIncludeAlreadyMatched = () => {
    setIncludeAlreadyMatched(!includeAlreadyMatched);
  };

  const matchTransactionMutation = useMutation(
    trpc.inbox.matchTransaction.mutationOptions({
      onMutate: async (variables) => {
        const { id, transactionId } = variables;
        const queryKey = trpc.inbox.getById.queryKey({ id });

        await queryClient.cancelQueries({ queryKey });

        const previousInboxItem = queryClient.getQueryData(queryKey);

        const selectedTransaction = transactionMatch?.find(
          (t) => t.transaction_id === transactionId,
        );

        if (previousInboxItem && selectedTransaction) {
          queryClient.setQueryData(queryKey, {
            ...previousInboxItem,
            transactionId,
            transaction: {
              id: selectedTransaction.transaction_id,
              name: selectedTransaction.name,
              date: selectedTransaction.transaction_date,
              amount: selectedTransaction.transaction_amount,
              currency: selectedTransaction.transaction_currency,
            },
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
          queryKey: trpc.inbox.getById.queryKey({ id: variables.id }),
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

  const handleSelect = (option?: { id: string; name: string }) => {
    if (option) {
      matchTransactionMutation.mutate({
        id: id!,
        transactionId: option.id,
      });
    }
  };

  useEffect(() => {
    if (id) {
      onOpenChange(false);
    }
  }, [id]);

  if (data?.transactionId) {
    return <TransactionUnmatchItem />;
  }

  return (
    <div className="bg-background h-12 relative">
      <Combobox
        key={data?.transaction?.id}
        placeholder="Select a transaction"
        className="w-full bg-transparent px-12 h-12 border border-border dark:border-none"
        classNameList="bottom-[50px] border border-border dark:border-none max-h-[270px]"
        onValueChange={handleChange}
        value={selectedValue}
        options={options ?? []}
        isLoading={isSearching}
        open={isOpen}
        onOpenChange={onOpenChange}
        onFocus={handleFocus}
        onSelect={handleSelect}
      />

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleIncludeAlreadyMatched}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 z-10 h-6 w-6 ${
                includeAlreadyMatched
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icons.Filter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs px-3 py-1.5">
            {includeAlreadyMatched
              ? "Hide already matched transactions"
              : "Show already matched transactions"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
