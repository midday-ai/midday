"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import type { Invoice } from "@/components/tables/invoices/columns";
import { getDueDateStatus } from "@/utils/format";
import { formatDate } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { useState } from "react";

type Props = {
  invoice: Invoice;
};

export function InvoiceRowSkeleton() {
  return (
    <li className="h-[57px] flex items-center w-full">
      <div className="flex items-center w-full">
        <div className="flex flex-col space-y-1 w-1/4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="w-1/4">
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="w-1/4">
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="w-1/4 flex justify-end">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </li>
  );
}

export function InvoiceRow({ invoice }: Props) {
  const [isOpen, setOpen] = useState(false);

  const showDate =
    invoice.status === "unpaid" ||
    invoice.status === "overdue" ||
    invoice.status === "pending";

  return (
    <>
      <li
        key={invoice.id}
        className="h-[57px] flex items-center w-full"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center w-full">
          <div className="flex flex-col space-y-1 w-1/4">
            <span className="text-sm">
              {invoice.due_date ? formatDate(invoice.due_date) : "-"}
            </span>
            {showDate && (
              <span className="text-xs text-muted-foreground">
                {invoice.due_date ? getDueDateStatus(invoice.due_date) : "-"}
              </span>
            )}
          </div>

          <div className="w-1/4">
            <InvoiceStatus status={invoice.status} />
          </div>

          <div className="w-1/4 text-sm">{invoice.customer?.name}</div>

          <div
            className={cn(
              "w-1/4 flex justify-end text-sm",
              invoice.status === "canceled" && "line-through",
            )}
          >
            <FormatAmount amount={invoice.amount} currency={invoice.currency} />
          </div>
        </div>
      </li>

      <InvoiceDetailsSheet data={invoice} setOpen={setOpen} isOpen={isOpen} />
    </>
  );
}
