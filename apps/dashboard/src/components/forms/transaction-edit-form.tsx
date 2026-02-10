"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { utc } from "@date-fns/utc";
import { uniqueCurrencies } from "@midday/location/currencies";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import { CurrencyInput } from "@midday/ui/currency-input";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Switch } from "@midday/ui/switch";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { AssignUser } from "@/components/assign-user";
import { SelectAccount } from "@/components/select-account";
import { SelectCategory } from "@/components/select-category";
import { SelectCurrency } from "@/components/select-currency";
import { TransactionAttachments } from "@/components/transaction-attachments";
import { useInvalidateTransactionQueries } from "@/hooks/use-invalidate-transaction-queries";
import { useUpdateTransactionCategory } from "@/hooks/use-update-transaction-category";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";

type Transaction = RouterOutputs["transactions"]["getById"];

type Props = {
  transaction: NonNullable<Transaction>;
};

export function TransactionEditForm({ transaction }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateTransactionQueries = useInvalidateTransactionQueries();
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useUserQuery();
  const { data: accounts } = useQuery(
    trpc.bankAccounts.get.queryOptions({
      enabled: true,
    }),
  );

  const { data: categories } = useQuery(
    trpc.transactionCategories.get.queryOptions(),
  );

  const { updateCategory } = useUpdateTransactionCategory();

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

          queryClient.invalidateQueries({
            queryKey: trpc.transactions.getById.queryKey({
              id: transaction.id,
            }),
          });

          // Invalidate global search
          queryClient.invalidateQueries({
            queryKey: trpc.search.global.queryKey(),
          });
        }
      },
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.transactions.getById.queryKey({
              id: transaction.id,
            }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);

        // Snapshot the previous values
        const previousData = {
          details: queryClient.getQueryData(
            trpc.transactions.getById.queryKey({ id: transaction.id }),
          ),
          list: queryClient.getQueryData(
            trpc.transactions.get.infiniteQueryKey(),
          ),
        };

        // Optimistically update details view
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transaction.id }),
          (old: any) => {
            if (variables.categorySlug && categories) {
              const category = categories.find(
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
                data: page.data.map((t: any) =>
                  t.id === transaction.id
                    ? {
                        ...t,
                        ...variables,
                      }
                    : t,
                ),
              })),
            };
          },
        );

        return { previousData };
      },
      onError: (_, __, context) => {
        // Revert on error
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.transactions.getById.queryKey({ id: transaction.id }),
            context.previousData.details,
          );
          queryClient.setQueryData(
            trpc.transactions.get.infiniteQueryKey(),
            context.previousData.list,
          );
        }
      },
    }),
  );

  // Derive transaction type from amount sign
  // Ensure amount is treated as a number for comparison
  // Default to expense if amount is 0 or undefined
  // Positive amounts = income, negative amounts = expense
  const transactionAmount =
    typeof transaction.amount === "number"
      ? transaction.amount
      : Number(transaction.amount) || 0;

  // Determine type: use amount sign as primary indicator
  // Negative amounts = expense, positive amounts = income
  let transactionType: "income" | "expense";

  // Primary check: use amount sign
  if (transactionAmount > 0) {
    transactionType = "income";
  } else if (transactionAmount < 0) {
    transactionType = "expense";
  } else {
    // Amount is 0, check category as fallback
    transactionType =
      transaction.category?.slug === "income" ? "income" : "expense";
  }

  // Local state only for debounced inputs
  const [name, setName] = useState(transaction.name);
  // Store amount with correct sign (negative for expense, positive for income)
  const [amount, setAmount] = useState(Math.abs(transaction.amount));
  const [note, setNote] = useState(transaction.note ?? "");

  // Debounce text inputs
  const [debouncedName] = useDebounceValue(name, 500);
  const [debouncedAmount] = useDebounceValue(amount, 500);
  const [debouncedNote] = useDebounceValue(note, 500);

  // Sync local state with transaction prop when it changes
  useEffect(() => {
    setName(transaction.name);
    setAmount(Math.abs(transaction.amount));
    setNote(transaction.note ?? "");
  }, [transaction.id, transaction.name, transaction.amount, transaction.note]);

  // Update on debounced name change
  useEffect(() => {
    if (debouncedName !== transaction.name && debouncedName.trim()) {
      updateTransactionMutation.mutate({
        id: transaction.id,
        name: debouncedName,
      });
    }
  }, [debouncedName]);

  // Update on debounced amount change
  useEffect(() => {
    // Amount is stored with correct sign (negative for expense, positive for income)
    const finalAmount =
      transactionType === "expense"
        ? -Math.abs(debouncedAmount)
        : Math.abs(debouncedAmount);

    // Ensure we're comparing numbers
    const currentAmount = Number(transaction.amount);
    if (finalAmount !== currentAmount) {
      updateTransactionMutation.mutate({
        id: transaction.id,
        amount: finalAmount,
      });
    }
  }, [debouncedAmount, transactionType, transaction.amount, transaction.id]);

  // Update on debounced note change
  useEffect(() => {
    const noteValue = debouncedNote?.trim() || null;
    if (noteValue !== (transaction.note ?? null)) {
      updateTransactionMutation.mutate({
        id: transaction.id,
        note: noteValue,
      });
    }
  }, [debouncedNote]);

  // Memoize selected category from transaction
  const selectedCategory = useMemo(() => {
    if (transaction.category) {
      return {
        id: transaction.category.id,
        name: transaction.category.name,
        color: transaction.category.color ?? "",
        slug: transaction.category.slug ?? "",
      };
    }

    return undefined;
  }, [transaction.category]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex w-full border border-border bg-muted">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-6 px-2 flex-1 rounded-none text-xs border-r border-border last:border-r-0",
              transactionType === "expense"
                ? "bg-transparent"
                : "bg-background font-medium",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Clear income category if switching to expense
              if (transaction.category?.slug === "income") {
                updateTransactionMutation.mutate({
                  id: transaction.id,
                  categorySlug: "uncategorized",
                });
              }
              // Update amount immediately (convert to negative)
              const finalAmount = -Math.abs(amount);
              updateTransactionMutation.mutate({
                id: transaction.id,
                amount: finalAmount,
              });
            }}
          >
            Expense
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-6 px-2 flex-1 rounded-none text-xs border-r border-border last:border-r-0",
              transactionType === "income"
                ? "bg-transparent"
                : "bg-background font-medium",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Update amount immediately
              const finalAmount = Math.abs(amount);
              updateTransactionMutation.mutate({
                id: transaction.id,
                amount: finalAmount,
              });
            }}
          >
            Income
          </Button>
        </div>
        <p className="text-[0.8rem] text-muted-foreground mt-2">
          Select whether this is money coming in (income) or going out (expense)
        </p>
      </div>

      <div>
        <Label htmlFor="name" className="mb-2 block">
          Description
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Office supplies, Invoice payment"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        <p className="text-[0.8rem] text-muted-foreground mt-2">
          A brief description of what this transaction is for
        </p>
      </div>

      <div className="flex space-x-4">
        <div className="w-full">
          <Label htmlFor="amount" className="mb-2 block">
            Amount
          </Label>
          <CurrencyInput
            value={amount}
            placeholder="0.00"
            allowNegative={false}
            onValueChange={(values) => {
              // Only update local state - the debounced effect handles the mutation
              if (values.floatValue !== undefined) {
                setAmount(Math.abs(values.floatValue));
              }
            }}
          />
          <p className="text-[0.8rem] text-muted-foreground mt-2">
            Enter the transaction amount
          </p>
        </div>

        <div className="w-full">
          <Label htmlFor="currency" className="mb-2 block">
            Currency
          </Label>
          <SelectCurrency
            className="w-full"
            currencies={uniqueCurrencies}
            onChange={(value) => {
              updateTransactionMutation.mutate({
                id: transaction.id,
                currency: value,
              });
            }}
            value={transaction.currency}
          />
          <p className="text-[0.8rem] text-muted-foreground mt-2">
            The currency for this transaction
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-full">
          <Label htmlFor="account" className="mb-2 block">
            Account
          </Label>
          <SelectAccount
            onChange={(value) => {
              updateTransactionMutation.mutate({
                id: transaction.id,
                bankAccountId: value.id,
              });

              if (value.currency) {
                updateTransactionMutation.mutate({
                  id: transaction.id,
                  currency: value.currency,
                });
              }
            }}
            value={transaction.account?.id ?? accounts?.at(0)?.id ?? ""}
            placeholder="Select account"
          />
          <p className="text-[0.8rem] text-muted-foreground mt-2">
            The account this transaction belongs to
          </p>
        </div>

        <div className="w-full">
          <Label htmlFor="date" className="mb-2 block">
            Date
          </Label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsOpen(true)}
              >
                {transaction.date ? (
                  format(utc(transaction.date), user?.dateFormat ?? "PPP")
                ) : (
                  <span>Select date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                selected={transaction.date ? utc(transaction.date) : undefined}
                onSelect={(value) => {
                  if (value) {
                    // Use formatISO with date representation to format as YYYY-MM-DD
                    // This handles timezone correctly by using the date components
                    const dateValue = formatISO(value, {
                      representation: "date",
                    });
                    setIsOpen(false);
                    updateTransactionMutation.mutate({
                      id: transaction.id,
                      date: dateValue,
                    });
                  }
                }}
                initialFocus
                toDate={new Date()}
              />
            </PopoverContent>
          </Popover>
          <p className="text-[0.8rem] text-muted-foreground mt-2">
            When this transaction occurred
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-full">
          <Label htmlFor="category" className="mb-2 block">
            Category
          </Label>
          <SelectCategory
            onChange={async (value) => {
              if (value && transaction.name) {
                await updateCategory(transaction.id, transaction.name, {
                  id: value.id,
                  name: value.name,
                  slug: value.slug,
                });
              } else if (!value && transaction.name) {
                await updateCategory(transaction.id, transaction.name, {
                  id: "",
                  name: "",
                  slug: "",
                });
              }
            }}
            hideLoading
            selected={selectedCategory}
          />
          <p className="text-[0.8rem] text-muted-foreground mt-2">
            Help organize and track your transactions
          </p>
        </div>

        <div className="w-full">
          <Label htmlFor="assign" className="mb-2 block">
            Assign
          </Label>
          <AssignUser
            selectedId={transaction.assigned?.id ?? undefined}
            onSelect={(user) => {
              updateTransactionMutation.mutate({
                id: transaction.id,
                assignedId: user?.id ?? null,
              });
            }}
          />
          <p className="text-[0.8rem] text-muted-foreground mt-2">
            Assign this transaction to a team member
          </p>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["attachment"]}>
        <AccordionItem value="attachment">
          <AccordionTrigger>Attachment</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Upload receipts, invoices, or other documents related to this
                transaction
              </p>
              <TransactionAttachments
                id={transaction.id}
                data={transaction.attachments}
                onUpload={(_files) => {
                  // Note: Attachments are handled by TransactionAttachments component
                  // The component manages its own state and updates the transaction
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <div className="mt-6 mb-4">
          <Label htmlFor="settings" className="mb-2 block font-medium text-md">
            Exclude from reports
          </Label>
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs text-muted-foreground">
                Exclude this transaction from reports like profit, expense and
                revenue. This is useful for internal transfers between accounts
                to avoid double-counting.
              </p>
            </div>

            <Switch
              checked={transaction.internal ?? false}
              onCheckedChange={(checked) => {
                updateTransactionMutation.mutate({
                  id: transaction.id,
                  internal: checked,
                });
              }}
            />
          </div>
        </div>

        <AccordionItem value="note">
          <AccordionTrigger>Note</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Add any additional details or context about this transaction
              </p>
              <Textarea
                placeholder="Note"
                className="min-h-[100px] resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
