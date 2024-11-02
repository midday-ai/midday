import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { format } from "date-fns";
import { CopyInput } from "./copy-input";
import { FormatAmount } from "./format-amount";
import { InvoiceActions } from "./invoice-actions";
import { InvoiceNote } from "./invoice-note";
import { InvoiceStatus } from "./invoice-status";
import type { Invoice } from "./tables/invoices/columns";

type Props = Invoice;

export function InvoiceDetails({
  id,
  customer,
  amount,
  currency,
  status,
  vat,
  tax,
  paid_at,
  due_date,
  invoice_date,
  invoice_number,
  template,
  token,
  internal_note,
}: Props) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 mt-1 items-center">
          <Avatar className="size-5">
            {customer?.website && (
              <AvatarImage
                src={`https://img.logo.dev/${customer?.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60`}
                alt={`${customer?.name} logo`}
              />
            )}
            <AvatarFallback className="text-[9px] font-medium">
              {customer?.name?.[0]}
            </AvatarFallback>
          </Avatar>

          <span className="text-sm line-clamp-1">{customer?.name}</span>
        </div>
        <InvoiceStatus status={status} />
      </div>

      <div className="flex justify-between items-center mt-6 mb-3">
        <div className="flex flex-col w-full space-y-1">
          <span
            className={cn("text-4xl font-mono select-text", {
              "line-through": status === "canceled",
            })}
          >
            <FormatAmount amount={amount} currency={currency} />
          </span>

          <div className="h-3 space-x-2">
            {vat && vat > 0 && (
              <span className="text-[#606060] text-xs select-text">
                VAT <FormatAmount amount={vat} currency={currency} />
              </span>
            )}

            {tax && tax > 0 && (
              <span className="text-[#606060] text-xs select-text">
                Sales tax <FormatAmount amount={tax} currency={currency} />
              </span>
            )}
          </div>
        </div>
      </div>

      <InvoiceActions status={status} id={id} />

      {status === "paid" && (
        <div className="mt-8 flex flex-col space-y-1">
          <span className="text-base font-medium">
            Paid on {paid_at && format(new Date(paid_at), "MMM dd")}
          </span>
          <span className="text-xs">
            <span className="text-[#606060]">Marked as paid</span>
          </span>
        </div>
      )}

      <div className="mt-6 flex flex-col space-y-4 border-t border-border pt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Due date</span>
          <span className="text-sm">
            <span>{due_date && format(new Date(due_date), "MMM dd")}</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Invoice date</span>
          <span className="text-sm">
            <span>
              {invoice_date && format(new Date(invoice_date), "MMM dd")}
            </span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Invoice no.</span>
          <span className="text-sm">
            <span>{invoice_number}</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Recurring</span>
          <span className="text-sm">
            <span>One time</span>
          </span>
        </div>
      </div>

      {customer && (
        <div className="mt-6 flex flex-col space-y-2 border-t border-border pt-6">
          <span className="text-sm text-[#606060]">Invoice link</span>
          <div className="flex w-full gap-2">
            <div className="flex-1 min-w-0">
              <CopyInput value={`${window.location.origin}/i/${token}`} />
            </div>

            {status !== "draft" && (
              <a
                href={`/api/download/invoice?id=${id}&size=${template?.size}`}
                download
              >
                <Button
                  variant="secondary"
                  className="size-[40px] hover:bg-secondary shrink-0"
                >
                  <div>
                    <Icons.Download className="size-4" />
                  </div>
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        className="mt-6"
        defaultValue={internal_note ? "note" : undefined}
      >
        <AccordionItem value="note">
          <AccordionTrigger>Internal note</AccordionTrigger>
          <AccordionContent>
            <InvoiceNote id={id} defaultValue={internal_note} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
