"use client";

import { generateCsvMapping } from "@/actions/ai/generate-csv-mapping";
import { SelectAccount } from "@/components/select-account";
import { SelectCurrency } from "@/components/select-currency";
import { Icons } from "@midday/ui/icons";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Spinner } from "@midday/ui/spinner";
import { readStreamableValue } from "ai/rsc";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { mappableFields, useCsvContext } from "./context";

export function FieldMapping({ currencies }: { currencies: string[] }) {
  const { fileColumns, firstRows, setValue, control } = useCsvContext();
  const [isStreaming, setIsStreaming] = useState(true);
  const [showCurrency, setShowCurrency] = useState(false);

  useEffect(() => {
    if (!fileColumns || !firstRows) return;

    generateCsvMapping(fileColumns, firstRows)
      .then(async ({ object }) => {
        setIsStreaming(true);

        for await (const partialObject of readStreamableValue(object)) {
          if (partialObject) {
            for (const [field, value] of Object.entries(partialObject)) {
              if (
                Object.keys(mappableFields).includes(field) &&
                fileColumns.includes(value)
              ) {
                setValue(field as keyof typeof mappableFields, value, {
                  shouldValidate: true,
                });
              }
            }
          }
        }
      })
      .finally(() => setIsStreaming(false));
  }, [fileColumns, firstRows]);

  return (
    <div>
      <Controller
        control={control}
        name="bank_account_id"
        render={({ field: { value, onChange } }) => (
          <SelectAccount
            className="w-full"
            placeholder="Select account"
            value={value}
            onChange={(account) => {
              onChange(account.id);
              setValue("currency", account?.currency ?? undefined, {
                shouldValidate: true,
              });
              setShowCurrency(Boolean(!account.currency));
            }}
          />
        )}
      />

      {showCurrency && (
        <Controller
          control={control}
          name="currency"
          render={({ field: { onChange, value } }) => (
            <SelectCurrency
              className="w-full mt-4 mb-6"
              value={value}
              onChange={onChange}
              currencies={Object.values(currencies)?.map(
                (currency) => currency,
              )}
            />
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 pt-6  border-t-[1px] border-border">
        <div className="text-sm">CSV Data column</div>
        <div className="text-sm">Midday data column</div>
        {(Object.keys(mappableFields) as (keyof typeof mappableFields)[]).map(
          (field) => (
            <FieldRow key={field} field={field} isStreaming={isStreaming} />
          ),
        )}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  isStreaming,
}: {
  field: keyof typeof mappableFields;
  isStreaming: boolean;
}) {
  const { label, required } = mappableFields[field];
  const { control, watch, fileColumns, firstRows } = useCsvContext();

  const value = watch(field);

  const isLoading = isStreaming && !value;

  return (
    <>
      <div className="relative flex min-w-0 items-center gap-2">
        <Controller
          control={control}
          name={field}
          rules={{ required }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full relative" hideIcon={isLoading}>
                <SelectValue placeholder={`Select ${label}`} />

                {isLoading && (
                  <div className="absolute right-2">
                    <Spinner />
                  </div>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[
                    ...(fileColumns || []),
                    ...(field.value && !required ? ["None"] : []),
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
          )}
        />

        <div className="flex items-center justify-end">
          <Icons.ArrowRightAlt className="size-4 text-[#878787]" />
        </div>
      </div>

      <span className="flex h-9 w-full items-center justify-between whitespace-nowrap border border-border bg-transparent px-3 py-2 text-sm">
        <span className="grow whitespace-nowrap text-sm font-normal text-muted-foreground">
          {label}
        </span>
      </span>
    </>
  );
}
