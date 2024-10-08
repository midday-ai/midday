"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function OpenInvoiceSheet() {
  const { setParams } = useInvoiceParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ invoiceId: "1" })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
