"use client";

import { Form } from "@/components/invoice/form";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React from "react";
import { useFormContext } from "react-hook-form";
import type { Customer } from "../invoice/customer-details";
import { SettingsMenu } from "../invoice/settings-menu";

type Props = {
  teamId: string;
  customers: Customer[];
};

export function InvoiceCreateSheet({
  teamId,

  customers,
}: Props) {
  const { setParams, createInvoice } = useInvoiceParams();
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 816;

  const isOpen = Boolean(createInvoice);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent
        style={{ maxWidth: size }}
        className="!bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out"
      >
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Invoice</h2>
          <SettingsMenu />
        </SheetHeader>

        <Form teamId={teamId} customers={customers} />
      </SheetContent>
    </Sheet>
  );
}
