"use client";

import { Sheet } from "@midday/ui/sheet";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { FormContext } from "@/components/invoice/form-context";
import { InvoiceContent } from "@/components/invoice-content";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";

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
        staleTime: 30 * 1000, // 30 seconds - prevents excessive refetches when reopening
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

      // Clear the draft snapshot so the next open starts fresh
      useInvoiceEditorStore.getState().reset();
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
