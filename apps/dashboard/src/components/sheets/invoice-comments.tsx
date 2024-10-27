"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
// import { createClient } from "@midday/supabase/client";
// import { getCustomerQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React, { useEffect, useState } from "react";

export function InvoiceCommentsSheet() {
  //   const [customer, setCustomer] = useState<Customer | null>(null);
  const { setParams, invoiceId, type } = useInvoiceParams();

  const isOpen = Boolean(invoiceId && type === "comments");
  //   const supabase = createClient();

  //   useEffect(() => {
  //     async function fetchCustomer() {
  //       const { data } = await getCustomerQuery(supabase, customerId);

  //       if (data) {
  //         setCustomer(data);
  //       }
  //     }

  //     if (customerId) {
  //       fetchCustomer();
  //     }
  //   }, [customerId]);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Comments</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setParams(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
