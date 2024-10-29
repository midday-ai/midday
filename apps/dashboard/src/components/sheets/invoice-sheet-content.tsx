"use client";

import { SheetContent } from "@midday/ui/sheet";
import { useFormContext } from "react-hook-form";

export function InvoiceSheetContent({
  children,
}: { children: React.ReactNode }) {
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 816;

  return (
    <SheetContent
      style={{ maxWidth: size }}
      className="!bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out"
    >
      {children}
    </SheetContent>
  );
}
