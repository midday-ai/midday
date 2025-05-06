"use client";

import { InvoiceSuccess } from "@/components/invoice-success";
import { Form } from "@/components/invoice/form";
import { SettingsMenu } from "@/components/invoice/settings-menu";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useFormContext } from "react-hook-form";

export function InvoiceContent() {
  const { type } = useInvoiceParams();
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 740;

  if (type === "success") {
    return (
      <SheetContent className="bg-white dark:bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out">
        <InvoiceSuccess />
      </SheetContent>
    );
  }

  return (
    <SheetContent
      style={{ maxWidth: size }}
      className="bg-white dark:bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out"
    >
      <SheetHeader className="mb-6 flex justify-between items-center flex-row">
        <div className="ml-auto">
          <SettingsMenu />
        </div>
      </SheetHeader>

      <Form />
    </SheetContent>
  );
}
