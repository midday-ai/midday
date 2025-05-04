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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CopyInput } from "./copy-input";
import { FormatAmount } from "./format-amount";
import { InvoiceActions } from "./invoice-actions";
import { InvoiceDetailsSkeleton } from "./invoice-details-skeleton";
import { InvoiceNote } from "./invoice-note";
import { InvoiceStatus } from "./invoice-status";
import { OpenURL } from "./open-url";

export function InvoiceDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    params: { invoiceId },
  } = useInvoiceParams();

  const isOpen = Boolean(invoiceId);

  const { data, isLoading } = useQuery({
    ...trpc.invoice.getById.queryOptions({
      id: invoiceId!,
    }),
    enabled: isOpen,
    staleTime: 60 * 1000,
    initialData: () => {
      const pages = queryClient
        .getQueriesData({ queryKey: trpc.invoice.get.infiniteQueryKey() })
        .flatMap(([, data]) => data?.pages ?? [])
        .flatMap((page) => page.data ?? []);

      return pages.find((d) => d.id === invoiceId);
    },
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
    paid_at,
    due_date,
    issue_date,
    invoice_number,
    template,
    token,
    internal_note,
    updated_at,
    customer_name,
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
              {customer?.name?.at(0) || customer_name?.at(0)}
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
            <FormatAmount amount={amount} currency={currency} />
          </span>

          <div className="h-3 space-x-2">
            {vat !== 0 && (
              <span className="text-[#606060] text-xs select-text">
                {/* @ts-expect-error - vat_label is not typed (JSONB) */}
                {template?.vat_label}{" "}
                <FormatAmount amount={vat} currency={currency} />
              </span>
            )}

            {tax !== 0 && (
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
            Paid on {paid_at && format(new Date(paid_at), "MMM dd")}
          </span>
          <span className="text-xs">
            <span className="text-[#606060]">Marked as paid</span>
          </span>
        </div>
      )}

      {status === "canceled" && (
        <div className="mt-8 flex flex-col space-y-1">
          <span className="text-base font-medium">
            Canceled on {updated_at && format(new Date(updated_at), "MMM dd")}
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
            <span>{due_date && format(new Date(due_date), "MMM dd")}</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#606060]">Issue date</span>
          <span className="text-sm">
            <span>{issue_date && format(new Date(issue_date), "MMM dd")}</span>
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
            <div className="flex-1 min-w-0 relative">
              <CopyInput value={`${getUrl()}/i/${token}`} />

              <div className="absolute right-9 top-[11px]">
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
