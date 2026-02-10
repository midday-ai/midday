"use client";

import { SheetContent } from "@midday/ui/sheet";
import { useFormContext } from "react-hook-form";
import { Form } from "@/components/invoice/form";
import { InvoiceSuccess } from "@/components/invoice-success";
import { useInvoiceParams } from "@/hooks/use-invoice-params";

export function InvoiceContent() {
  const { type } = useInvoiceParams();
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 740;

  if (type === "success") {
    return (
      <SheetContent className="bg-white dark:bg-[#080808] transition-[max-width] duration-300 ease-in-out">
        <InvoiceSuccess />
      </SheetContent>
    );
  }

  return (
    <SheetContent
      style={{ maxWidth: size }}
      className="bg-white dark:bg-[#080808] transition-[max-width] duration-300 ease-in-out p-0"
    >
      <Form />
    </SheetContent>
  );
}
