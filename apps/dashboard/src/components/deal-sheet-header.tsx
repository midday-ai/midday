"use client";

import { useTRPC } from "@/trpc/client";
import { SheetHeader } from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";

type Props = {
  dealId: string;
};

export function DealSheetHeader({ dealId }: Props) {
  const trpc = useTRPC();

  const { data: deal } = useQuery(
    trpc.deal.getById.queryOptions(
      {
        id: dealId,
      },
      {
        enabled: Boolean(dealId),
      },
    ),
  );

  if (deal?.template?.deliveryType === "create_and_send") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Created & Sent</h2>
        <p className="text-sm text-[#808080]">
          Your deal was created and sent successfully
        </p>
      </SheetHeader>
    );
  }

  if (deal?.template?.deliveryType === "scheduled") {
    return (
      <SheetHeader className="mb-6 flex flex-col">
        <h2 className="text-xl">Scheduled</h2>
        <p className="text-sm text-[#808080]">
          Your deal was scheduled successfully
        </p>
      </SheetHeader>
    );
  }

  // Default: created
  return (
    <SheetHeader className="mb-6 flex flex-col">
      <h2 className="text-xl">Created</h2>
      <p className="text-sm text-[#808080]">
        Your deal was created successfully
      </p>
    </SheetHeader>
  );
}
