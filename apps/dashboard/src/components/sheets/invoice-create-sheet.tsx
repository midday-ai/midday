"use client";

import type { InvoiceTemplate } from "@/actions/invoice/schema";
import { Form } from "@/components/invoice/form";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
// import { createClient } from "@midday/supabase/client";
// import { getInvoiceQuery } from "@midday/supabase/queries";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React, { useEffect, useState } from "react";
import type { Customer } from "../invoice/customer-details";
// import type { Invoice } from "../tables/invoices/columns";

type Props = {
  teamId: string;
  template: InvoiceTemplate;
  customers: Customer[];
  invoiceNumber: string;
};

export function InvoiceCreateSheet({
  teamId,
  template,
  customers,
  invoiceNumber,
}: Props) {
  // const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { setParams, createInvoice, invoiceId } = useInvoiceParams();

  const isOpen = Boolean(createInvoice);

  // const supabase = createClient();

  // useEffect(() => {
  //   async function fetchInvoice() {
  //     const { data } = await getInvoiceQuery(supabase, invoiceId);

  //     if (data) {
  //       setInvoice(data);
  //     }
  //   }

  //   if (invoiceId) {
  //     fetchInvoice();
  //   }
  // }, [invoiceId]);

  // console.log(invoice);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent style={{ maxWidth: 610 }} className="!bg-[#0C0C0C]">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Invoice</h2>
          <Icons.MoreVertical className="size-5" />
        </SheetHeader>

        <Form
          teamId={teamId}
          template={template}
          customers={customers}
          invoiceNumber={invoiceNumber}
        />
      </SheetContent>
    </Sheet>
  );
}
