"use client";

import { CurrencyInput } from "@midday/ui/currency-input";
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
import {
  calculateTaxAmountFromGross,
  calculateTaxRateFromGross,
  getTaxTypeLabel,
} from "@midday/utils/tax";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useTRPC } from "@/trpc/client";
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
        // Cancel any outgoing refetches
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.transactions.getById.queryKey({ id: transactionId }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);

        // Snapshot the previous value
        const previousData = {
          details: queryClient.getQueryData(
            trpc.transactions.getById.queryKey({ id: transactionId }),
          ),
          list: queryClient.getQueryData(
            trpc.transactions.get.infiniteQueryKey(),
          ),
        };

        // Optimistically update the details view
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId }),
          (old: any) => ({
            ...old,
            ...variables,
          }),
        );

        // Optimistically update the list view
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
      onSettled: () => {
        // Invalidate to refetch fresh data
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const isPercentageMode = taxRate !== null && taxRate !== undefined;

  // Local state for controlled inputs
  const [localTaxRate, setLocalTaxRate] = useState(taxRate?.toString() ?? "");
  const [localTaxAmount, setLocalTaxAmount] = useState(taxAmount ?? 0);

  // Track the transaction ID to reset state when switching transactions
  const lastTransactionIdRef = useRef(transactionId);

  // Only sync from props when transaction changes (not from our own mutations)
  useEffect(() => {
    if (lastTransactionIdRef.current !== transactionId) {
      lastTransactionIdRef.current = transactionId;
      setLocalTaxRate(taxRate?.toString() ?? "");
      setLocalTaxAmount(taxAmount ?? 0);
    }
  }, [transactionId, taxRate, taxAmount]);

  // Debounced mutation call
  const debouncedUpdate = useDebounceCallback(
    (params: { taxRate: number | null; taxAmount: number | null }) => {
      updateTransactionMutation.mutate({
        id: transactionId,
        ...params,
      });
    },
    500,
  );

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
        {isPercentageMode ? (
          <Input
            type="number"
            placeholder="0"
            step="0.01"
            min="0"
            max="100"
            className="pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={localTaxRate}
            onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => {
              const inputValue = e.target.value;
              setLocalTaxRate(inputValue);

              const numValue = inputValue
                ? Number.parseFloat(inputValue)
                : null;

              // Validate percentage is between 0 and 100
              if (numValue !== null && (numValue < 0 || numValue > 100)) {
                return;
              }

              // Calculate and debounce the update
              // Note: 0 is a valid value (explicit override of category default)
              // Transaction amounts are gross (tax-inclusive), so use reverse calculation
              const calculatedTaxAmount =
                numValue !== null && amount
                  ? calculateTaxAmountFromGross(amount, numValue)
                  : null;

              debouncedUpdate({
                taxRate: numValue,
                taxAmount: calculatedTaxAmount,
              });
            }}
          />
        ) : (
          <CurrencyInput
            placeholder="0"
            className="pr-16"
            value={localTaxAmount ?? undefined}
            onValueChange={(values) => {
              const value = values.floatValue ?? 0;
              setLocalTaxAmount(value);

              // Note: 0 is a valid value (explicit override of category default)
              debouncedUpdate({
                taxRate: null,
                taxAmount: value,
              });
            }}
            decimalScale={2}
            fixedDecimalScale={false}
            thousandSeparator={true}
          />
        )}
        <Select
          value={isPercentageMode ? "percentage" : "fixed"}
          onValueChange={(value: "percentage" | "fixed") => {
            if (value === "percentage") {
              // Switch to percentage mode
              // Calculate rate from existing taxAmount but keep the taxAmount as-is
              // Transaction amounts are gross (tax-inclusive), so use reverse calculation
              const calculatedRate =
                taxAmount && amount
                  ? calculateTaxRateFromGross(amount, taxAmount)
                  : 0;

              // Keep the existing taxAmount to avoid rounding errors
              updateTransactionMutation.mutate({
                id: transactionId,
                taxRate: calculatedRate,
                taxAmount: taxAmount ?? 0,
              });
            } else {
              // Switch to fixed mode: keep taxAmount, clear taxRate
              updateTransactionMutation.mutate({
                id: transactionId,
                taxRate: null,
                taxAmount: taxAmount ?? 0,
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
      {taxAmount !== null && taxAmount !== undefined && taxAmount > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {getTaxLabel()}:{" "}
          <FormatAmount
            amount={taxAmount}
            currency={currency}
            maximumFractionDigits={2}
          />
          {taxRate !== null &&
            taxRate !== undefined &&
            taxRate > 0 &&
            ` (${taxRate}%)`}
        </p>
      )}
    </div>
  );
}
