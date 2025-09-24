"use client";

import { InvoiceContent } from "@/components/invoice-content";
import { FormContext } from "@/components/invoice/form-context";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { Sheet } from "@midday/ui/sheet";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React from "react";

export function InvoiceSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams, type, invoiceId } = useInvoiceParams();
  const isOpen = type === "create" || type === "edit" || type === "success";

  // Get default settings for new invoices
  const { data: defaultSettings } = useSuspenseQuery(
    trpc.invoice.defaultSettings.queryOptions(),
  );

  // Get draft invoice for edit
  const { data } = useQuery(
    trpc.invoice.getById.queryOptions(
      {
        id: invoiceId!,
      },
      {
        enabled: !!invoiceId,
        staleTime: 0,
      },
    ),
  );

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      // Invalidate queries when closing the sheet to prevent stale data
      queryClient.invalidateQueries({
        queryKey: trpc.invoice.getById.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.invoice.defaultSettings.queryKey(),
      });
    }

    setParams(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <FormContext defaultSettings={defaultSettings} data={data}>
        <InvoiceContent />
      </FormContext>
    </Sheet>
  );
}
