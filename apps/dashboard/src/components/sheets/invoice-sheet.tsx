"use client";

import { Sheet } from "@midday/ui/sheet";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { FormContext } from "@/components/invoice/form-context";
import { InvoiceContent } from "@/components/invoice-content";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";

export function InvoiceSheet() {
  const trpc = useTRPC();
  const { setParams, type, invoiceId } = useInvoiceParams();
  const isOpen = type === "create" || type === "edit" || type === "success";

  // Get default settings for new invoices
  const { data: defaultSettings, refetch } = useSuspenseQuery(
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
      },
    ),
  );

  const handleOnOpenChange = (open: boolean) => {
    // Refetch default settings when the sheet is closed
    if (!open) {
      refetch();
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
