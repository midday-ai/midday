"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
// import { createClient } from "@midday/supabase/client";
// import { getCustomerQuery } from "@midday/supabase/queries";

import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React, { useEffect, useState } from "react";
import { InvoiceComments } from "../invoice-comments";

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
        <SheetHeader className="mb-10 flex justify-between items-center flex-row">
          <h2 className="text-xl">Comments</h2>
        </SheetHeader>

        <InvoiceComments />
      </SheetContent>
    </Sheet>
  );
}
