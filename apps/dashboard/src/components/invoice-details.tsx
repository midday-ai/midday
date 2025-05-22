"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { getWebsiteLogo } from "@/utils/logos";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CopyInput } from "./copy-input";
import { FormatAmount } from "./format-amount";
import { InvoiceActions } from "./invoice-actions";
import { InvoiceDetailsSkeleton } from "./invoice-details-skeleton";
import { InvoiceNote } from "./invoice-note";
import { InvoiceStatus } from "./invoice-status";
import { InvoiceActivity } from "./invoice/activity";
import { OpenURL } from "./open-url";

export function InvoiceDetails() {
  const trpc = useTRPC();
  const { invoiceId } = useInvoiceParams();

  const isOpen = invoiceId !== null;

  const { data, isLoading } = useQuery({
    ...trpc.invoice.getById.queryOptions({ id: invoiceId! }),
    enabled: isOpen,
  });

  if (isLoading) {
    return <InvoiceDetailsSkeleton />;
  }

  if (!data) {
    return null;
  }

  const {
    id,
    customer,
    amount,
    currency,
    status,
    vat,
    tax,
    paidAt,
    dueDate,
    issueDate,
    invoiceNumber,
    template,
    token,
    internalNote,
    updatedAt,
    sentAt,
    sentTo,
    customerName,
  } = data;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 mt-1 items-center">
          <Avatar className="size-5">
            {customer?.website && (
              <AvatarImageNext
                src={getWebsiteLogo(customer?.website)}
                alt={`${customer?.name} logo`}
                width={20}
                height={20}
                quality={100}
              />
            )}
            <AvatarFallback className="text-[9px] font-medium">
              {customer?.name?.at(0) || customerName?.at(0)}
            </AvatarFallback>
          </Avatar>

          <span className="text-sm line-clamp-1">{customer?.name}</span>
        </div>
        <InvoiceStatus status={status} />
      </div>

      <div className="flex justify-between items-center mt-6 mb-3 relative">
        <div className="flex flex-col w-full space-y-1">
          <span
            className={cn("text-4xl font-mono select-text", {
              "line-through": status === "canceled",
            })}
          >
            {currency && (
              <FormatAmount amount={amount ?? 0} currency={currency} />
            )}
          </span>

          <div className="h-3 space-x-2">
            {vat !== 0 && vat != null && currency && (
              <span className="text-[#606060] text-xs select-text">
                {/* @ts-expect-error - vat_label is not typed (JSONB) */}
                {template?.vat_label}{" "}
                <FormatAmount amount={vat} currency={currency} />
              </span>
            )}

            {tax !== 0 && tax != null && currency && (
              <span className="text-[#606060] text-xs select-text">
                {/* @ts-expect-error - tax_label is not typed (JSONB) */}
                {template?.tax_label}{" "}
                <FormatAmount amount={tax} currency={currency} />
              </span>
            )}
          </div>
        </div>
      </div>

      <InvoiceActions status={status} id={id} />

      {status === "paid" && (
        <div className="mt-8 flex flex-col space-y-1">
          <span className="text-base font-medium">
            Paid on {paidAt && format(new Date(paidAt), "MMM dd")}
          </span>
          <span className="text-xs">
            <span className="text-[#606060]">Marked as paid</span>
          </span>
        </div>
      )}

      {status === "canceled" && (
        <div className="mt-8 flex flex-col space-y-1">
          <span className="text-base font-medium">
            Canceled on {updatedAt && format(new Date(updatedAt), "MMM dd")}
          </span>
          <span className="text-xs">
            <span className="text-[#606060]">Marked as canceled</span>
          </span>
        </div>
      )}

      <div className="mt-6 flex flex-col space-y-4 border-t border-border pt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Due date</span>
          <span className="text-sm">
            <span>{dueDate && format(new Date(dueDate), "MMM dd")}</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Issue date</span>
          <span className="text-sm">
            <span>{issueDate && format(new Date(issueDate), "MMM dd")}</span>
          </span>
        </div>

        {sentAt && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#606060]">Sent at</span>
            <span className="text-sm">
              <span>{sentAt && format(new Date(sentAt), "MMM dd")}</span>
            </span>
          </div>
        )}

        {sentTo && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#606060]">Sent to</span>
            <span className="text-sm">{sentTo}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Invoice no.</span>
          <span className="text-sm">
            <span>{invoiceNumber}</span>
          </span>
        </div>
      </div>

      {customer && (
        <div className="mt-6 flex flex-col space-y-2 border-t border-border pt-6">
          <span className="text-sm text-[#606060]">Invoice link</span>
          <div className="flex w-full gap-2">
            <div className="flex-1 min-w-0 relative">
              <CopyInput value={`${getUrl()}/i/${token}`} className="pr-14" />

              <div className="absolute right-10 top-[11px] border-r border-border pr-2">
                <OpenURL href={`${getUrl()}/i/${token}`}>
                  <Icons.OpenInNew />
                </OpenURL>
              </div>
            </div>

            {status !== "draft" && (
              <a
                // @ts-expect-error - template?.size is not typed (JSONB)
                href={`/api/download/invoice?id=${id}&size=${template?.size}`}
                download
              >
                <Button
                  variant="secondary"
                  className="size-[38px] hover:bg-secondary shrink-0"
                >
                  <div>
                    <Icons.ArrowCoolDown className="size-4" />
                  </div>
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      <Accordion
        type="multiple"
        className="mt-6"
        defaultValue={internalNote ? ["note", "activity"] : ["activity"]}
      >
        <AccordionItem value="activity">
          <AccordionTrigger>Activity</AccordionTrigger>
          <AccordionContent>
            <InvoiceActivity data={data} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="note">
          <AccordionTrigger>Internal note</AccordionTrigger>
          <AccordionContent>
            <InvoiceNote id={id} defaultValue={internalNote} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
