"use client";

import { DealSuccess } from "@/components/deal-success";
import { Form } from "@/components/deal/form";
import { useDealParams } from "@/hooks/use-deal-params";
import { SheetContent } from "@midday/ui/sheet";
import { useFormContext } from "react-hook-form";

export function DealContent() {
  const { type } = useDealParams();
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 740;

  if (type === "success") {
    return (
      <SheetContent className="bg-white dark:bg-[#080808] transition-[max-width] duration-300 ease-in-out">
        <DealSuccess />
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
