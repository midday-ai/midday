"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useEffect } from "react";
import type { z } from "zod";

// Helper utilities for filter mappers
export function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeEnum<const TValues extends readonly string[]>(
  value: unknown,
  allowedValues: TValues,
): TValues[number] | null {
  return typeof value === "string" && allowedValues.includes(value)
    ? (value as TValues[number])
    : null;
}

export function normalizeArray<T>(
  value: unknown,
  validator?: (item: unknown) => item is T,
): T[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const filtered = validator ? value.filter(validator) : value;
  return filtered.length > 0 ? (filtered as T[]) : null;
}

export function mapStringArrayToIds<T>(
  names: unknown[] | undefined | null,
  lookup: (name: string) => T | null | undefined,
): T[] | null {
  if (!Array.isArray(names) || names.length === 0) return null;
  const ids = names
    .filter((n): n is string => typeof n === "string" && n.length > 0)
    .map(lookup)
    .filter((id): id is T => id != null);
  return ids.length > 0 ? ids : null;
}

export function validateEnumArray<const TValues extends readonly string[]>(
  values: unknown,
  allowedValues: TValues,
): TValues[number][] | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const filtered = values.filter(
    (v): v is TValues[number] =>
      typeof v === "string" && allowedValues.includes(v),
  );
  return filtered.length > 0 ? filtered : null;
}

export function validateNumberRange(value: unknown): [number, number] | null {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    Number.isNaN(value[0]) ||
    Number.isNaN(value[1])
  ) {
    return null;
  }
  return [value[0], value[1]];
}

interface Options<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TData = Record<string, unknown>,
> {
  api: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  mapper: (
    input: z.infer<TInputSchema>,
    data?: TData,
  ) => z.infer<TOutputSchema>;
  onFilterApplied: (filters: z.infer<TOutputSchema>) => void;
  data?: TData;
}

export function useAIFilter<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TData = Record<string, unknown>,
>({
  api,
  inputSchema,
  outputSchema,
  mapper,
  onFilterApplied,
  data,
}: Options<TInputSchema, TOutputSchema, TData>) {
  const { object, submit, isLoading } = useObject({
    api,
    schema: inputSchema,
  });

  useEffect(() => {
    if (object && !isLoading) {
      const mappedFilters = mapper(object, data);
      const result = outputSchema.safeParse(mappedFilters);

      if (result.success) {
        onFilterApplied(result.data);
      } else {
        console.error("Filter output validation failed:", result.error);
      }
    }
  }, [object, isLoading, mapper, data, outputSchema, onFilterApplied]);

  return {
    submit,
    isLoading,
  };
}
