"use client";

import { useInvalidateTransactionQueries } from "@/hooks/use-invalidate-transaction-queries";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { Switch } from "@midday/ui/switch";
import { ToastAction } from "@midday/ui/toast";
import { toast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { DealPicker } from "./deal-picker";
import { FormatAmount } from "./format-amount";
import { Note } from "./note";
import { SelectTags } from "./select-tags";
import { SuggestedMatch } from "./suggested-match";
import { TransactionAttachments } from "./transaction-attachments";
import { TransactionBankAccount } from "./transaction-bank-account";
import { TransactionShortcuts } from "./transaction-shortcuts";
import { TransactionSource } from "./transaction-source";
import { TransactionTypeBadge } from "./transaction-type-badge";

export function TransactionDetails() {
  const trpc = useTRPC();
  const { transactionId } = useTransactionParams();
  const queryClient = useQueryClient();
  const invalidateTransactionQueries = useInvalidateTransactionQueries();

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.transactions.getById.queryOptions({ id: transactionId! }),
    enabled: Boolean(transactionId),
    staleTime: 0, // Always consider data stale so it always refetches
    initialData: () => {
      const pages = queryClient
        .getQueriesData({ queryKey: trpc.transactions.get.infiniteQueryKey() })
        // @ts-expect-error
        .flatMap(([, data]) => data?.pages ?? [])
        .flatMap((page) => page.data ?? []);

      return pages.find((d) => d.id === transactionId);
    },
  });

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: (_, variables) => {
        // If category or internal (exclude from reports) changed, invalidate reports and widgets
        if ("categorySlug" in variables || "internal" in variables) {
          invalidateTransactionQueries();
        } else {
          // Otherwise just invalidate transaction queries
          queryClient.invalidateQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          });
        }
      },
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.transactions.getById.queryKey({
              id: transactionId!,
            }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);

        // Snapshot the previous values
        const previousData = {
          details: queryClient.getQueryData(
            trpc.transactions.getById.queryKey({ id: transactionId! }),
          ),
          list: queryClient.getQueryData(
            trpc.transactions.get.infiniteQueryKey(),
          ),
        };

        // Optimistically update details view
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId! }),
          (old: any) => {
            if (variables.categorySlug) {
              const categories = queryClient.getQueryData(
                trpc.transactionCategories.get.queryKey(),
              );
              const category = categories?.find(
                (c) => c.slug === variables.categorySlug,
              );

              if (category) {
                return {
                  ...old,
                  ...variables,
                  category,
                };
              }
            }

            return {
              ...old,
              ...variables,
            };
          },
        );

        // Optimistically update list view
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          (old: any) => {
            if (!old?.pages) return old;

            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.map((transaction: any) =>
                  transaction.id === transactionId
                    ? {
                        ...transaction,
                        ...variables,
                        ...(variables.categorySlug && {
                          category: queryClient
                            .getQueryData(
                              trpc.transactionCategories.get.queryKey(),
                            )
                            ?.find((c) => c.slug === variables.categorySlug),
                        }),
                      }
                    : transaction,
                ),
              })),
            };
          },
        );

        return { previousData };
      },
      onError: (_, __, context) => {
        // Revert both caches on error
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId! }),
          context?.previousData.details,
        );
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          context?.previousData.list,
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const createTransactionTagMutation = useMutation(
    trpc.transactionTags.create.mutationOptions({
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

  const deleteTransactionTagMutation = useMutation(
    trpc.transactionTags.delete.mutationOptions({
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

  const updateTransactionsMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: (_, data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const [showExplanation, setShowExplanation] = useState(false);

  const {
    data: explainData,
    isLoading: isExplaining,
    refetch: fetchExplanation,
  } = useQuery({
    ...trpc.transactions.explain.queryOptions({ id: transactionId! }),
    enabled: false,
  });

  if (isLoading || !data) {
    return null;
  }

  const defaultValue: string[] = [];

  if (data?.note) {
    defaultValue.push("note");
  }

  return (
    <div className="h-[calc(100vh-80px)] scrollbar-hide overflow-auto pb-12">
      <div className="flex justify-between mb-8">
        <div className="flex-1 flex-col">
          {isLoading ? (
            <div className="flex items-center justify-between  mt-1 mb-6">
              <div className="flex space-x-2 items-center">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="w-[100px] h-[14px] rounded-full" />
              </div>
              <Skeleton className="w-[10%] h-[14px] rounded-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {data?.account?.connection?.logoUrl && (
                  <TransactionBankAccount
                    name={data?.account?.name ?? undefined}
                    logoUrl={data.account.connection.logoUrl}
                    className="text-[#606060] text-xs"
                  />
                )}
                <TransactionSource
                  manual={data?.manual ?? false}
                  hasAccount={Boolean(data?.account)}
                  accountName={data?.account?.name ?? undefined}
                />
              </div>
              <span className="text-[#606060] text-xs select-text">
                {data?.date && format(parseISO(data.date), "MMM d, y")}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 mb-3">
            <h2 className="select-text">
              {isLoading ? (
                <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
              ) : (
                data?.name
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7"
              disabled={isExplaining}
              onClick={() => {
                setShowExplanation(true);
                fetchExplanation();
              }}
            >
              <Icons.AI size={14} />
              Explain
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full space-y-1">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span
                  className={cn(
                    "text-4xl select-text font-serif",
                    data?.amount > 0 && "text-[#00C969]",
                  )}
                >
                  <FormatAmount
                    amount={data?.amount}
                    currency={data?.currency}
                  />
                </span>
              )}
              <div className="h-3" />
            </div>
          </div>
        </div>
      </div>

      {data?.description && (
        <div className="border dark:bg-[#1A1A1A]/95 px-4 py-3 text-sm text-popover-foreground select-text">
          {data.description}
        </div>
      )}

      {showExplanation && (
        <div className="mt-4 rounded-md border bg-blue-50/50 dark:bg-blue-950/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Icons.AI size={14} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-600">
              AI Explanation
            </span>
          </div>
          {isExplaining ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-3 rounded" />
              <Skeleton className="w-[80%] h-3 rounded" />
              <Skeleton className="w-[60%] h-3 rounded" />
            </div>
          ) : (
            <p className="text-sm text-foreground/80 select-text leading-relaxed">
              {explainData?.explanation}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
        <div>
          <Label htmlFor="type" className="mb-2 block">
            Type
          </Label>

          <TransactionTypeBadge type={data?.transactionType} />
        </div>

        <div>
          <Label htmlFor="deal" className="mb-2 block">
            Deal
          </Label>

          {isLoading ? (
            <div className="h-[36px] border">
              <Skeleton className="h-[14px] w-[60%] absolute left-3 top-[39px]" />
            </div>
          ) : (
            <DealPicker
              selectedDealCode={data?.dealCode ?? undefined}
              onSelect={(dealCode) => {
                updateTransactionMutation.mutate({
                  id: data?.id,
                  dealCode,
                });
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="tags" className="mb-2 block">
          Tags
        </Label>

        <SelectTags
          key={data?.id + data?.tags?.length}
          tags={data?.tags?.map((tag) => ({
            id: tag.id,
            label: tag.name!,
            value: tag.name!,
          }))}
          onSelect={(tag) => {
            if (tag.id) {
              createTransactionTagMutation.mutate({
                tagId: tag.id,
                transactionId: transactionId!,
              });
            }
          }}
          onRemove={(tag) => {
            if (tag.id) {
              deleteTransactionTagMutation.mutate({
                tagId: tag.id,
                transactionId: transactionId!,
              });
            }
          }}
        />
      </div>

      {(data?.suggestion?.suggestionId || data?.hasPendingSuggestion) && (
        <div className="mt-6">
          <SuggestedMatch
            suggestion={data?.suggestion}
            transactionId={transactionId!}
            isLoading={
              data?.hasPendingSuggestion && !data?.suggestion?.suggestionId
            }
          />
        </div>
      )}

      <Accordion type="multiple" defaultValue={defaultValue}>
        <AccordionItem value="attachment">
          <AccordionTrigger>Attachments</AccordionTrigger>
          <AccordionContent className="select-text">
            <TransactionAttachments id={data?.id} data={data?.attachments} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="general">
          <AccordionTrigger>General</AccordionTrigger>
          <AccordionContent className="select-text">
            <div className="mb-4 border-b pb-4">
              <Label className="mb-2 block font-medium text-md">
                Exclude from reports
              </Label>
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs text-muted-foreground">
                    Exclude this transaction from reports like profit, expense
                    and revenue. This is useful for internal transfers between
                    accounts to avoid double-counting.
                  </p>
                </div>

                <Switch
                  checked={data?.internal ?? false}
                  onCheckedChange={(checked) => {
                    updateTransactionMutation.mutate({
                      id: data?.id,
                      internal: checked,
                    });
                  }}
                />
              </div>
            </div>

            <TaxAmount
              transactionId={data?.id}
              amount={data?.amount}
              currency={data?.currency}
              taxRate={data?.taxRate}
              taxAmount={data?.taxAmount}
              taxType={data?.taxType}
            />

            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <Label className="mb-2 block font-medium text-md">
                  Mark as recurring
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark as recurring. Similar future transactions will be
                  automatically categorized and flagged as recurring.
                </p>
              </div>
              <Switch
                checked={data?.recurring ?? false}
                onCheckedChange={(checked) => {
                  updateTransactionMutation.mutate({
                    id: data?.id,
                    recurring: checked,
                  });
                }}
              />
            </div>

            {data?.recurring && (
              <Select
                value={data?.frequency ?? undefined}
                onValueChange={async (value) => {
                  updateTransactionMutation.mutate({
                    id: data?.id,
                    frequency: value as
                      | "weekly"
                      | "monthly"
                      | "annually"
                      | "irregular",
                  });

                  const similarTransactions = await queryClient.fetchQuery(
                    trpc.transactions.getSimilarTransactions.queryOptions({
                      transactionId: data?.id,
                      name: data.name,
                      frequency: value as
                        | "weekly"
                        | "monthly"
                        | "annually"
                        | "irregular",
                    }),
                  );

                  if (
                    similarTransactions?.length &&
                    similarTransactions.length > 1
                  ) {
                    toast({
                      duration: 6000,
                      variant: "ai",
                      title: "Abacus AI",
                      description: `We found ${similarTransactions?.length} similar transactions to "${data?.name}". Mark them as recurring (${value}) too?`,
                      footer: (
                        <div className="flex space-x-2 mt-4">
                          <ToastAction altText="Cancel" className="pl-5 pr-5">
                            Cancel
                          </ToastAction>
                          <ToastAction
                            altText="Yes"
                            onClick={() => {
                              // Use bulk update with the similar transaction IDs
                              const similarTransactionIds =
                                similarTransactions.map((t) => t.id);
                              updateTransactionsMutation.mutate({
                                ids: similarTransactionIds,
                                recurring: true,
                                frequency: value as
                                  | "weekly"
                                  | "monthly"
                                  | "annually"
                                  | "irregular",
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
                }}
              >
                <SelectTrigger className="w-full mt-4">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[
                      { id: "weekly", name: "Weekly" },
                      { id: "monthly", name: "Monthly" },
                      { id: "annually", name: "Annually" },
                    ].map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="note">
          <AccordionTrigger>Note</AccordionTrigger>
          <AccordionContent className="select-text">
            <Note
              defaultValue={data?.note ?? ""}
              onChange={(value) => {
                updateTransactionMutation.mutate({
                  id: data?.id,
                  note: value,
                });
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TransactionShortcuts />
    </div>
  );
}
