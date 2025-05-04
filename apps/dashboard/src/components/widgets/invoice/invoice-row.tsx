"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { getDueDateStatus } from "@/utils/format";
import { formatDate } from "@/utils/format";
import { cn } from "@midday/ui/cn";

type Props = {
  invoice: NonNullable<RouterOutputs["invoice"]["get"]["data"]>[number];
};

export function InvoiceRow({ invoice }: Props) {
  const showDate = invoice.status === "unpaid" || invoice.status === "overdue";

  return (
    <>
      <li
        key={invoice.id}
        className="h-[57px] flex items-center w-full"
        // onClick={() => setOpen(true)}
      >
        <div className="flex items-center w-full">
          <div className="flex flex-col space-y-1 w-[90px]">
            <span className="text-sm">
              {invoice.due_date ? formatDate(invoice.due_date) : "-"}
            </span>
            {showDate && (
              <span className="text-xs text-muted-foreground">
                {invoice.due_date ? getDueDateStatus(invoice.due_date) : "-"}
              </span>
            )}
          </div>

          <div className="w-[85px]">
            <InvoiceStatus status={invoice.status} />
          </div>

          <div className="flex-1 text-sm line-clamp-1 pr-4">
            {invoice.customer?.name}
          </div>

          <div
            className={cn(
              "w-1/4 flex justify-end text-sm",
              invoice.status === "canceled" && "line-through",
            )}
          >
            <FormatAmount
              amount={invoice.amount ?? 0}
              currency={invoice.currency ?? "USD"}
            />
          </div>
        </div>
      </li>
    </>
  );
}
