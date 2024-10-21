"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { v4 as uuidv4 } from "uuid";

export function OpenInvoiceSheet() {
  const { setParams } = useInvoiceParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ createInvoice: true, invoiceId: uuidv4() })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
