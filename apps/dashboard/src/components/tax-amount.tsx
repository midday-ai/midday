"use client";

import { useTRPC } from "@/trpc/client";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { getTaxTypeLabel } from "@midday/utils/tax";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormatAmount } from "./format-amount";

type TaxAmountProps = {
  transactionId: string;
  amount: number;
  currency: string;
  taxRate?: number | null;
  taxAmount?: number | null;
  taxType?: string | null;
};

export function TaxAmount({
  transactionId,
  amount,
  currency,
  taxRate,
  taxAmount,
  taxType,
}: TaxAmountProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.transactions.getById.queryKey({ id: transactionId }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);

        // Snapshot previous value
        const previousData = {
          details: queryClient.getQueryData(
            trpc.transactions.getById.queryKey({ id: transactionId }),
          ),
          list: queryClient.getQueryData(
            trpc.transactions.get.infiniteQueryKey(),
          ),
        };

        // Optimistically update details view
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId }),
          (old: any) => ({
            ...old,
            ...variables,
          }),
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
        // Revert on error
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.transactions.getById.queryKey({ id: transactionId }),
            context.previousData.details,
          );
          queryClient.setQueryData(
            trpc.transactions.get.infiniteQueryKey(),
            context.previousData.list,
          );
        }
      },
      onSuccess: (data) => {
        // Update with server response
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId }),
          data,
        );
        // Only invalidate list view
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
      onSettled: () => {
        // Final refetch to ensure consistency (only for details view)
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId }),
        });
      },
    }),
  );
  const isPercentageMode = taxRate !== null && taxRate !== undefined;

  // Get dynamic label based on tax type
  const getTaxLabel = () => {
    if (!taxType) return "Tax amount";

    const taxLabel = getTaxTypeLabel(taxType);
    return taxLabel ? `${taxLabel} amount` : "Tax amount";
  };

  return (
    <div className="mb-4 border-b pb-4">
      <Label className="mb-2 block font-medium text-md">{getTaxLabel()}</Label>
      <div className="relative">
        <Input
          type="number"
          placeholder="0"
          step="0.01"
          className="pr-16"
          value={isPercentageMode ? taxRate : (taxAmount ?? "")}
          onChange={(e) => {
            const value = e.target.value
              ? Number.parseFloat(e.target.value)
              : null;

            if (isPercentageMode) {
              // Percentage mode: save taxRate and calculate taxAmount
              const calculatedTaxAmount =
                value !== null && amount
                  ? Math.abs(amount) * (value / 100)
                  : null;
              updateTransactionMutation.mutate({
                id: transactionId,
                taxRate: value,
                taxAmount: calculatedTaxAmount,
              });
            } else {
              // Fixed amount mode: save only taxAmount, set taxRate to null
              updateTransactionMutation.mutate({
                id: transactionId,
                taxRate: null,
                taxAmount: value,
              });
            }
          }}
        />
        <Select
          value={isPercentageMode ? "percentage" : "fixed"}
          onValueChange={(value: "percentage" | "fixed") => {
            if (value === "percentage") {
              // Switch to percentage mode
              // If there's a current taxAmount, try to calculate a rate and round to 2 decimals
              const calculatedRate =
                taxAmount && amount
                  ? Math.round((taxAmount / Math.abs(amount)) * 100 * 100) / 100
                  : 0;

              const calculatedTaxAmount =
                calculatedRate && amount
                  ? Math.abs(amount) * (calculatedRate / 100)
                  : 0;

              updateTransactionMutation.mutate({
                id: transactionId,
                taxRate: calculatedRate,
                taxAmount: calculatedTaxAmount,
              });
            } else {
              // Switch to fixed mode: keep taxAmount, clear taxRate
              updateTransactionMutation.mutate({
                id: transactionId,
                taxRate: null,
                taxAmount: taxAmount ?? 0, // Default to 0 for fixed mode
              });
            }
          }}
        >
          <SelectTrigger className="absolute right-0 top-0 h-full w-[70px] border-0 bg-transparent text-xs justify-end gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="fixed">{currency}</SelectItem>
              <SelectItem value="percentage">%</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {taxAmount && (
        <p className="text-xs text-muted-foreground mt-2">
          {getTaxLabel()}:{" "}
          <FormatAmount
            amount={taxAmount}
            currency={currency}
            maximumFractionDigits={2}
          />
          {taxRate && ` (${taxRate}%)`}
        </p>
      )}
    </div>
  );
}
