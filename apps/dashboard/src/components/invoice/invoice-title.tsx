"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { Input } from "./input";

export function InvoiceTitle() {
  const { watch } = useFormContext();
  const invoiceTitle = watch("template.title");
  const [debouncedTitle] = useDebounceValue(invoiceTitle, 400);

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  useEffect(() => {
    if (debouncedTitle && debouncedTitle !== invoiceTitle) {
      updateTemplateMutation.mutate({ title: debouncedTitle });
    }
  }, [debouncedTitle, updateTemplateMutation]);

  return (
    <Input
      className="text-[21px] font-medium mb-2 w-fit min-w-[100px] !border-none"
      name="template.title"
    />
  );
}
