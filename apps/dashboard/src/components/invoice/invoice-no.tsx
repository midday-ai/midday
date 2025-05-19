"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";
import { LabelInput } from "./label-input";

export function InvoiceNo() {
  const {
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const invoiceNumber = watch("invoiceNumber");
  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const { type } = useInvoiceParams();

  const { data } = useQuery(
    trpc.invoice.searchInvoiceNumber.queryOptions(
      {
        query: invoiceNumber,
      },
      {
        // Only search for invoice number if we are creating a new invoice
        enabled: type === "create" && invoiceNumber !== "",
        // Never cache the result
        gcTime: 0,
      },
    ),
  );

  useEffect(() => {
    if (data) {
      setError("invoiceNumber", {
        type: "manual",
        message: "Invoice number already exists",
      });
    } else {
      clearErrors("invoiceNumber");
    }
  }, [data]);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center flex-shrink-0">
        <LabelInput
          name="template.invoiceNoLabel"
          onSave={(value) => {
            updateTemplateMutation.mutate({ invoiceNoLabel: value });
          }}
          className="truncate"
        />
        <span className="text-[11px] text-[#878787] font-mono flex-shrink-0">
          :
        </span>
      </div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Input
                name="invoiceNumber"
                className={cn(
                  "w-28 flex-shrink p-0 border-none text-[11px] h-4.5 overflow-hidden",
                  errors.invoiceNumber ? "text-red-500" : "",
                )}
              />
            </div>
          </TooltipTrigger>
          {errors.invoiceNumber && (
            <TooltipContent className="text-xs px-3 py-1.5">
              <p>Invoice number already exists</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
