"use client";

import { useTRPC } from "@/trpc/client";
import { SheetHeader } from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";

type Props = {
  invoiceId: string;
};

export function InvoiceSheetHeader({ invoiceId }: Props) {
  const trpc = useTRPC();

  const { data: invoice } = useQuery(
    trpc.invoice.getById.queryOptions(
      {
        id: invoiceId,
      },
      {
        enabled: Boolean(invoiceId),
      },
    ),
  );

  if (invoice?.template?.deliveryType === "create_and_send") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Created & Sent</h2>
        <p className="text-sm text-[#808080]">
          Your invoice was created and sent successfully
        </p>
      </SheetHeader>
    );
  }

  if (invoice?.template?.deliveryType === "scheduled") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Scheduled</h2>
        <p className="text-sm text-[#808080]">
          Your invoice was scheduled successfully
        </p>
      </SheetHeader>
    );
  }

  // Default: created
  return (
    <SheetHeader className="mb-6 flex flex-col">
      <h2 className="text-xl">Created</h2>
      <p className="text-sm text-[#808080]">
        Your invoice was created successfully
      </p>
    </SheetHeader>
  );
}
