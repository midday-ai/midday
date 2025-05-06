"use client";

import { SheetHeader } from "@midday/ui/sheet";

type Props = {
  type: "created" | "created_and_sent";
};

export function InvoiceSheetHeader({ type }: Props) {
  if (type === "created") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Created</h2>
        <p className="text-sm text-[#808080]">
          Your invoice was created successfully
        </p>
      </SheetHeader>
    );
  }

  if (type === "created_and_sent") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Created & Sent</h2>
        <p className="text-sm text-[#808080]">
          Your invoice was created and sent successfully
        </p>
      </SheetHeader>
    );
  }

  return null;
}
