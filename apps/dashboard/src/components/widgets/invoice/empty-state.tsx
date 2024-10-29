"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";

export function EmptyState() {
  const { setParams } = useInvoiceParams();

  return (
    <div className="flex flex-col space-y-4 items-center justify-center h-full text-center mt-16">
      <p className="text-sm text-[#606060]">
        No invoices created yet.
        <br />
        Create an invoice to get started.
      </p>

      <Button variant="outline" onClick={() => setParams({ type: "create" })}>
        Create invoice
      </Button>
    </div>
  );
}
