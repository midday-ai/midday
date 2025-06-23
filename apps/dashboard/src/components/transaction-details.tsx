"use client";

import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTRPC } from "@/trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
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
import { getTaxTypeLabel } from "@midday/utils/tax";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AssignUser } from "./assign-user";
import { FormatAmount } from "./format-amount";
import { Note } from "./note";
import { SelectCategory } from "./select-category";
import { SelectTags } from "./select-tags";
import { TransactionAttachments } from "./transaction-attachments";
import { TransactionBankAccount } from "./transaction-bank-account";
import { TransactionShortcuts } from "./transaction-shortcuts";

export function TransactionDetails() {
  const trpc = useTRPC();
  const { transactionId } = useTransactionParams();

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
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
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
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

  const updateSimilarTransactionsCategoryMutation = useMutation(
    trpc.transactions.updateSimilarTransactionsCategory.mutationOptions({
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

  if (isLoading || !data) {
    return null;
  }

  const defaultValue = ["attachment"];

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
              {data?.account?.connection?.logoUrl && (
                <TransactionBankAccount
                  name={data?.account?.name ?? undefined}
                  logoUrl={data.account.connection.logoUrl}
                  className="text-[#606060] text-xs"
                />
              )}
              <span className="text-[#606060] text-xs select-text">
                {data?.date && format(new Date(data.date), "MMM d, y")}
              </span>
            </div>
          )}

          <h2 className="mt-6 mb-3 select-text">
            {isLoading ? (
              <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
            ) : (
              data?.name
            )}
          </h2>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full space-y-1">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span
                  className={cn(
                    "text-4xl font-mono select-text",
                    data?.category?.slug === "income" && "text-[#00C969]",
                  )}
                >
                  <FormatAmount
                    amount={data?.amount}
                    currency={data?.currency}
                  />
                </span>
              )}
              <div className="h-3">
                {data?.taxAmount && data.taxAmount > 0 ? (
                  <span className="text-[#606060] text-xs select-text">
                    {data.taxType && `${getTaxTypeLabel(data.taxType)} `}
                    <FormatAmount
                      amount={data.taxAmount}
                      currency={data.currency}
                    />
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {data?.description && (
        <div className="border dark:bg-[#1A1A1A]/95 px-4 py-3 text-sm text-popover-foreground select-text">
          {data.description}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
        <div>
          <Label htmlFor="category" className="mb-2 block">
            Category
          </Label>

          <SelectCategory
            id={transactionId}
            // @ts-expect-error
            selected={data?.category ?? undefined}
            onChange={async (category) => {
              if (category) {
                updateTransactionMutation.mutate({
                  id: data?.id,
                  categorySlug: category.slug,
                });

                const similarTransactions = await queryClient.fetchQuery(
                  trpc.transactions.getSimilarTransactions.queryOptions({
                    name: data.name,
                    categorySlug: category.slug,
                  }),
                );

                if (
                  similarTransactions?.length &&
                  similarTransactions.length > 1
                ) {
                  toast({
                    duration: 6000,
                    variant: "ai",
                    title: "Midday AI",
                    description: `Do you want to mark ${similarTransactions?.length} similar transactions from ${data?.name} as ${category.name} too?`,
                    footer: (
                      <div className="flex space-x-2 mt-4">
                        <ToastAction altText="Cancel" className="pl-5 pr-5">
                          Cancel
                        </ToastAction>
                        <ToastAction
                          altText="Yes"
                          onClick={() => {
                            updateSimilarTransactionsCategoryMutation.mutate({
                              name: data.name,
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
              }
            }}
          />
        </div>

        <div>
          <Label htmlFor="assign" className="mb-2 block">
            Assign
          </Label>

          {isLoading ? (
            <div className="h-[36px] border">
              <Skeleton className="h-[14px] w-[60%] absolute left-3 top-[39px]" />
            </div>
          ) : (
            <AssignUser
              selectedId={data?.assigned?.id ?? undefined}
              onSelect={(user) => {
                if (user) {
                  updateTransactionMutation.mutate({
                    id: data?.id,
                    assignedId: user.id,
                  });
                }
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
                Exclude from analytics
              </Label>
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs text-muted-foreground">
                    Exclude this transaction from analytics like profit, expense
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
                      title: "Midday AI",
                      description: `Do you want to mark ${similarTransactions?.length} similar transactions from ${data?.name} as recurring (${value}) too?`,
                      footer: (
                        <div className="flex space-x-2 mt-4">
                          <ToastAction altText="Cancel" className="pl-5 pr-5">
                            Cancel
                          </ToastAction>
                          <ToastAction
                            altText="Yes"
                            onClick={() => {
                              updateSimilarTransactionsCategoryMutation.mutate({
                                name: data.name,
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
