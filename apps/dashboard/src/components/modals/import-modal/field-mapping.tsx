"use client";

import { readStreamableValue } from "@ai-sdk/rsc";
import { formatAmountValue, formatDate } from "@midday/import";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Spinner } from "@midday/ui/spinner";
import { Switch } from "@midday/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { capitalCase } from "change-case";
import { useEffect, useRef, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { generateCsvMapping } from "@/actions/ai/generate-csv-mapping";
import { SelectAccount } from "@/components/select-account";
import { SelectCurrency } from "@/components/select-currency";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { mappableFields, useCsvContext } from "./context";

export function FieldMapping({ currencies }: { currencies: string[] }) {
  const { fileColumns, firstRows, setValue, control, watch } = useCsvContext();
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const trpc = useTRPC();
  const { data: bankAccounts } = useQuery(trpc.bankAccounts.get.queryOptions());
  // Use ref to access latest bankAccounts without triggering effect
  const bankAccountsRef = useRef(bankAccounts);

  // Keep ref updated with latest bankAccounts value
  useEffect(() => {
    bankAccountsRef.current = bankAccounts;
  }, [bankAccounts]);

  useEffect(() => {
    if (!fileColumns || !firstRows) {
      setIsStreaming(false);
      return;
    }

    if (fileColumns.length === 0 || firstRows.length === 0) {
      setIsStreaming(false);
      return;
    }

    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    generateCsvMapping(fileColumns, firstRows)
      .then(async ({ object }) => {
        try {
          let finalMapping: Record<string, string> = {};

          for await (const partialObject of readStreamableValue(object)) {
            if (abortController.signal.aborted) {
              break;
            }

            if (partialObject) {
              // Merge partial updates into final mapping
              finalMapping = { ...finalMapping, ...partialObject };

              // Process field mappings as they come in
              for (const [field, value] of Object.entries(partialObject)) {
                if (
                  Object.keys(mappableFields).includes(field) &&
                  value &&
                  typeof value === "string" &&
                  fileColumns.includes(value)
                ) {
                  setValue(field as keyof typeof mappableFields, value, {
                    shouldValidate: true,
                  });
                }
              }
            }
          }

          // Process currency after stream completes
          const currencyValue = finalMapping.currency;
          if (currencyValue && typeof currencyValue === "string") {
            let detectedCurrency: string | null = null;

            // Check if it's a column name or a currency code
            if (fileColumns.includes(currencyValue)) {
              // It's a column name, extract currency from first row
              const firstRow = firstRows?.at(0);
              if (firstRow?.[currencyValue]) {
                detectedCurrency = firstRow[currencyValue].trim().toUpperCase();
              }
            } else {
              // It's a detected currency code
              detectedCurrency = currencyValue.trim().toUpperCase();
            }

            // Set currency if detected
            if (detectedCurrency) {
              setValue("currency", detectedCurrency, {
                shouldValidate: true,
              });

              // Find and pre-select account with matching currency
              // Use ref to get latest value without triggering effect
              const currentBankAccounts = bankAccountsRef.current;
              if (currentBankAccounts && currentBankAccounts.length > 0) {
                const matchingAccount = currentBankAccounts.find(
                  (account) =>
                    account.currency?.toUpperCase() === detectedCurrency,
                );

                if (matchingAccount) {
                  setValue("bank_account_id", matchingAccount.id, {
                    shouldValidate: true,
                  });
                  // Hide currency selector since account has currency
                  setShowCurrency(false);
                } else {
                  // No matching account, show currency selector
                  setShowCurrency(true);
                }
              }
            }
          }
        } catch (streamError) {
          console.error("Error reading stream:", streamError);
        }
      })
      .catch((error) => {
        console.error("Error generating CSV mapping:", error);
      })
      .finally(() => {
        setIsStreaming(false);
        abortControllerRef.current = null;
      });

    return () => {
      abortController.abort();
    };
  }, [fileColumns, firstRows, setValue]);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="text-sm">CSV Data column</div>
        <div className="text-sm">Midday data column</div>
        {(Object.keys(mappableFields) as (keyof typeof mappableFields)[]).map(
          (field) => (
            <FieldRow
              key={field}
              field={field}
              isStreaming={isStreaming}
              currency={watch("currency")}
            />
          ),
        )}
      </div>

      <Accordion
        defaultValue={undefined}
        collapsible
        type="single"
        className="w-full mt-6 border-t-[1px] border-border"
      >
        <AccordionItem value="settings">
          <AccordionTrigger className="text-sm">Settings</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Controller
                control={control}
                name="inverted"
                render={({ field: { onChange, value } }) => (
                  <div className="space-y-1">
                    <Label htmlFor="inverted">Inverted amount</Label>
                    <p className="text-sm text-[#606060]">
                      If the transactions are from credit account, you can
                      invert the amount.
                    </p>
                    <div className="flex justify-end">
                      <Switch
                        id="inverted"
                        checked={value}
                        onCheckedChange={onChange}
                      />
                    </div>
                  </div>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6">
        <Label className="mb-2 block">Account</Label>
        <Controller
          control={control}
          name="bank_account_id"
          render={({ field: { value, onChange } }) => (
            <SelectAccount
              className="w-full"
              placeholder="Select account"
              value={value}
              modal={false}
              popoverProps={{
                className: "z-[9999]",
                portal: true,
                avoidCollisions: true,
                collisionPadding: 8,
              }}
              onChange={(account) => {
                onChange(account.id);

                if (account.type === "credit") {
                  setValue("inverted", true, {
                    shouldValidate: true,
                  });
                }

                if (account?.currency) {
                  setValue("currency", account.currency, {
                    shouldValidate: true,
                  });

                  setShowCurrency(false);
                } else {
                  // Show currency select if account has no currency
                  setShowCurrency(!account.currency);
                }
              }}
            />
          )}
        />
      </div>

      {showCurrency && (
        <>
          <Label className="mb-2 mt-4 block">Currency</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <SelectCurrency
                className="w-full text-xs"
                value={value}
                onChange={onChange}
                currencies={Object.values(currencies)?.map(
                  (currency) => currency,
                )}
              />
            )}
          />
        </>
      )}
    </div>
  );
}

function FieldRow({
  field,
  isStreaming,
  currency,
}: {
  field: keyof typeof mappableFields;
  isStreaming: boolean;
  currency?: string;
}) {
  const { label, required } = mappableFields[field];
  const { control, fileColumns, firstRows } = useCsvContext();
  const { data: user } = useUserQuery();

  // Use useWatch for better reactivity when values change
  const value = useWatch({ control, name: field });
  const inverted = useWatch({ control, name: "inverted" });

  const isLoading = isStreaming && !value;

  const firstRow = firstRows?.at(0);

  const description = value && firstRow ? firstRow[value as string] : undefined;

  // Check if date field has valid parseable date
  const isDateInvalid =
    field === "date" && description && !formatDate(description);

  // Check if amount field has valid parseable number
  const parsedAmount = description
    ? formatAmountValue({ amount: description, inverted })
    : null;
  const isAmountInvalid =
    field === "amount" && description && Number.isNaN(parsedAmount);

  // Combined invalid state for styling
  const isFieldInvalid = isDateInvalid || isAmountInvalid;

  const formatDescription = (description?: string) => {
    if (!description) return;

    if (field === "date") {
      return formatDate(description);
    }

    if (field === "amount") {
      const amount = formatAmountValue({ amount: description, inverted });

      if (currency) {
        return formatAmount({ currency, amount, locale: user?.locale });
      }

      return amount;
    }

    if (field === "balance") {
      const amount = formatAmountValue({ amount: description });

      // Always invert the amount for balance
      const balance = +(amount * -1);

      if (currency) {
        return formatAmount({
          currency,
          amount: balance,
          locale: user?.locale,
        });
      }

      return balance;
    }

    if (field === "description") {
      return capitalCase(description);
    }

    return description;
  };

  // Get appropriate error message for invalid fields
  const getErrorMessage = () => {
    if (isDateInvalid) return "Invalid date format - cannot parse this date";
    if (isAmountInvalid) return "Invalid amount - cannot parse this number";
    return null;
  };

  return (
    <>
      <div className="relative flex min-w-0 items-center gap-2">
        <Controller
          control={control}
          name={field}
          rules={{ required }}
          render={({ field: controllerField }) => {
            return (
              <Select
                value={controllerField?.value ?? undefined}
                onValueChange={controllerField.onChange}
              >
                <SelectTrigger className="w-full relative" hideIcon={isLoading}>
                  <SelectValue placeholder={`Select ${label}`} />

                  {isLoading && (
                    <div className="absolute top-2 right-2">
                      <Spinner size={16} />
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {[
                      // Filter out empty columns
                      ...(fileColumns?.filter((column) => column !== "") || []),
                      ...(controllerField.value && !required ? ["None"] : []),
                    ]?.map((column) => {
                      return (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
          }}
        />

        <div className="flex items-center justify-end">
          <Icons.ArrowRightAlt className="size-4 text-[#878787]" />
        </div>
      </div>

      <span className="flex h-9 w-full items-center justify-between whitespace-nowrap border border-border bg-transparent px-3 py-2 text-sm">
        <div className="grow whitespace-nowrap text-sm font-normal text-muted-foreground justify-between flex">
          <span>{label}</span>

          {description?.trim() && (
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    {isFieldInvalid ? (
                      <Icons.AlertCircle className="size-4 text-destructive" />
                    ) : (
                      <Icons.Info />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="p-2 text-xs">
                  {getErrorMessage() ?? formatDescription(description)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </span>
    </>
  );
}
