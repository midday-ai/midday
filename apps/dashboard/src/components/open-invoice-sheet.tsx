"use client";

import { createInvoiceDraftAction } from "@/actions/invoice/create-draft-action";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useAction } from "next-safe-action/hooks";

export function OpenInvoiceSheet() {
  const { setParams } = useInvoiceParams();
  const createInvoiceDraft = useAction(createInvoiceDraftAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setParams({ invoiceId: data.id });
      }
    },
  });

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => createInvoiceDraft.execute()}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
