"use client";

import { TZDate } from "@date-fns/tz";
import { getFrequencyShortLabel } from "@midday/invoice/recurring";
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
import { useFileUrl } from "@/hooks/use-file-url";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { getWebsiteLogo } from "@/utils/logos";
import { CopyInput } from "./copy-input";
import { FormatAmount } from "./format-amount";
import { InvoiceActivity } from "./invoice/activity";
import { InvoiceActions } from "./invoice-actions";
import { InvoiceDetailsSkeleton } from "./invoice-details-skeleton";
import { InvoiceNote } from "./invoice-note";
import { InvoiceStatus } from "./invoice-status";
import { OpenURL } from "./open-url";

export function InvoiceDetails() {
  const trpc = useTRPC();
  const { invoiceId } = useInvoiceParams();
  const { data: user } = useUserQuery();

  const isOpen = invoiceId !== null;

  const { data, isLoading } = useQuery({
    ...trpc.invoice.getById.queryOptions({ id: invoiceId! }),
    enabled: isOpen,
  });

  // Fetch upcoming invoices for recurring series
  const { data: upcomingInvoices } = useQuery({
    ...trpc.invoiceRecurring.getUpcoming.queryOptions({
      id: data?.invoiceRecurringId ?? "",
      limit: 5,
    }),
    enabled: !!data?.invoiceRecurringId && data?.recurring?.status === "active",
  });

  const { url: downloadUrl } = useFileUrl({
    type: "invoice",
    invoiceId: invoiceId!,
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
    scheduledAt,
    paymentIntentId,
    refundedAt,
    invoiceRecurringId,
    recurring,
    recurringSequence,
  } = data;

  return (
    <div className="h-full">
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
            className={cn("text-4xl select-text font-serif", {
              "line-through": status === "canceled" || status === "refunded",
            })}
          >
            {currency && (
              <FormatAmount amount={amount ?? 0} currency={currency} />
            )}
          </span>

          <div className="h-3 space-x-2">
            {vat !== 0 && vat != null && currency && (
              <span className="text-[#606060] text-xs select-text">
                {template?.vatLabel}{" "}
                <FormatAmount amount={vat} currency={currency} />
              </span>
            )}

            {tax !== 0 && tax != null && currency && (
              <span className="text-[#606060] text-xs select-text">
                {template?.taxLabel}{" "}
                <FormatAmount amount={tax} currency={currency} />
              </span>
            )}
          </div>
        </div>
      </div>

      <InvoiceActions
        status={status}
        id={id}
        invoiceNumber={invoiceNumber}
        invoiceRecurringId={invoiceRecurringId}
        recurringStatus={recurring?.status}
        paymentIntentId={paymentIntentId}
      />

      <div className="h-full p-0 pb-[143px] overflow-y-auto scrollbar-hide">
        {status === "paid" && (
          <div className="mt-8">
            <span className="text-base font-medium">
              Paid on {paidAt && format(new Date(paidAt), "MMM dd")}
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

        {status === "refunded" && (
          <div className="mt-8">
            <span className="text-base font-medium">
              Refunded on {refundedAt && format(new Date(refundedAt), "MMM dd")}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col space-y-4 border-t border-border pt-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#606060]">Due date</span>
            <span className="text-sm">
              <span>
                {dueDate && format(new TZDate(dueDate, "UTC"), "MMM dd")}
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#606060]">Issue date</span>
            <span className="text-sm">
              <span>
                {issueDate && format(new TZDate(issueDate, "UTC"), "MMM dd")}
              </span>
            </span>
          </div>

          {scheduledAt && status === "scheduled" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#606060]">Scheduled at</span>
              <span className="text-sm">
                <span>
                  {format(
                    new Date(scheduledAt),
                    `MMM d, ${user?.timeFormat === 24 ? "HH:mm" : "h:mm a"}`,
                  )}
                </span>
              </span>
            </div>
          )}

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

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#606060]">Type</span>
            <span className="text-sm">
              {invoiceRecurringId && recurring ? (
                <span>
                  {getFrequencyShortLabel(
                    recurring.frequency,
                    recurring.frequencyInterval,
                  )}
                  {recurringSequence && recurring.endCount
                    ? ` (${recurringSequence} of ${recurring.endCount})`
                    : ""}
                </span>
              ) : (
                <span>One-time</span>
              )}
            </span>
          </div>

          {status === "paid" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#606060]">Payment</span>
              <span className="text-sm flex items-center gap-1.5">
                {paymentIntentId ? (
                  <svg
                    width="32"
                    height="13"
                    viewBox="0 0 512 214"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Stripe"
                  >
                    <path
                      fill="currentColor"
                      d="M35.982 83.484c0-5.546 4.551-7.68 12.09-7.68 10.808 0 24.461 3.272 35.27 9.103V51.484c-11.804-4.693-23.466-6.542-35.27-6.542-28.872 0-48.072 15.075-48.072 40.248 0 39.254 54.045 32.996 54.045 49.92 0 6.541-5.689 8.675-13.653 8.675-11.804 0-26.88-4.836-38.827-11.378v34.133c13.227 5.689 26.596 8.107 38.827 8.107 29.582 0 49.92-14.648 49.92-40.106-.142-42.382-54.187-35.413-54.187-51.058h-.143zm96.142-66.986l-34.702 7.395v113.92c0 21.049 15.786 36.551 36.835 36.551 11.662 0 20.196-2.133 24.889-4.693v-30.871c-4.551 1.849-27.022 8.391-27.022-12.658V77.653h27.022V47.36h-27.022V16.498zm71.111 41.387l-2.276-10.525h-30.72v124.445h35.556V84.32c8.39-10.951 22.613-8.96 27.022-7.396V47.36c-4.551-1.707-21.191-4.836-29.582 10.524zm38.258-10.524h35.698v124.444h-35.698V47.36zm0-10.809l35.698-7.68V0l-35.698 7.538v28.871h.142-.142zm109.938 10.524c-13.938 0-22.898 6.542-27.876 11.093l-1.849-8.817h-31.289v165.831l35.556-7.538v-40.248c5.12 3.698 12.658 8.96 25.173 8.96 25.458 0 48.64-20.48 48.64-65.564-.142-41.244-23.608-63.717-48.497-63.717h.142zm-8.533 97.991c-8.391 0-13.369-2.987-16.782-6.685V83.484c3.698-4.124 8.818-6.969 16.924-6.969 12.942 0 21.902 14.507 21.902 33.138 0 19.058-8.818 33.28-21.902 33.28l-.142.143zM512 110.08c0-36.409-17.636-65.138-51.342-65.138-33.849 0-54.329 28.729-54.329 64.853 0 42.809 24.178 64.427 58.88 64.427 16.924 0 29.724-3.84 39.395-9.245v-29.44c-9.671 4.835-20.764 7.822-34.844 7.822-13.796 0-26.027-4.835-27.591-21.618h69.547c0-1.849.284-9.244.284-12.658v-.003zm-69.973-13.511c0-16.071 9.813-22.756 18.773-22.756 8.676 0 17.92 6.685 17.92 22.756h-36.693z"
                    />
                  </svg>
                ) : (
                  <span>Manual</span>
                )}
              </span>
            </div>
          )}

          {refundedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#606060]">Refunded</span>
              <span className="text-sm">
                {format(new Date(refundedAt), "MMM dd")}
              </span>
            </div>
          )}
        </div>

        {invoiceRecurringId && recurring && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">Recurring Series</span>
              <span
                className={cn("text-xs px-2 py-0.5 rounded-full", {
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                    recurring.status === "active",
                  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400":
                    recurring.status === "paused",
                  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400":
                    recurring.status === "completed",
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":
                    recurring.status === "canceled",
                })}
              >
                {recurring.status === "active" && "Active"}
                {recurring.status === "paused" && "Paused"}
                {recurring.status === "completed" && "Completed"}
                {recurring.status === "canceled" && "Canceled"}
              </span>
            </div>

            {/* Upcoming invoices preview */}
            {upcomingInvoices?.invoices &&
              upcomingInvoices.invoices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {upcomingInvoices.invoices
                    .slice(0, recurring.endCount ? 5 : 3)
                    .map(
                      (
                        invoice: { date: string; amount: number },
                        index: number,
                      ) => {
                        // Check if this is the first invoice in the series and it's scheduled
                        const isCurrentScheduledInvoice =
                          index === 0 &&
                          status === "scheduled" &&
                          recurring.invoicesGenerated === 0;

                        return (
                          <div
                            key={index.toString()}
                            className={cn(
                              "flex items-center justify-between text-sm",
                              isCurrentScheduledInvoice &&
                                "bg-muted/50 -mx-2 px-2 py-1 rounded",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-[100px]">
                                {format(
                                  new TZDate(invoice.date, "UTC"),
                                  "MMM d, yyyy",
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {format(new TZDate(invoice.date, "UTC"), "EEE")}
                              </span>
                              {isCurrentScheduledInvoice && (
                                <span className="text-xs text-muted-foreground">
                                  (this invoice)
                                </span>
                              )}
                            </div>
                            <FormatAmount
                              amount={invoice.amount}
                              currency={currency ?? "USD"}
                            />
                          </div>
                        );
                      },
                    )}
                  {/* Show ellipsis if there are more invoices */}
                  {((recurring.endCount &&
                    recurring.endCount - recurring.invoicesGenerated > 5) ||
                    !recurring.endCount) && (
                    <div className="text-center text-muted-foreground">...</div>
                  )}
                </div>
              )}

            {/* Summary */}
            <div className="flex justify-between text-sm mt-4 pt-4 border-t border-border">
              {upcomingInvoices &&
              upcomingInvoices.summary?.totalCount !== null &&
              upcomingInvoices.summary?.totalAmount !== null ? (
                <>
                  <span>
                    {upcomingInvoices.summary.totalCount} invoices total
                  </span>
                  <FormatAmount
                    amount={upcomingInvoices.summary.totalAmount}
                    currency={currency ?? "USD"}
                  />
                </>
              ) : recurring.endType === "on_date" ? (
                <>
                  <span className="text-muted-foreground">Ends on date</span>
                  <span className="text-muted-foreground">
                    {recurring.invoicesGenerated} generated
                  </span>
                </>
              ) : recurring.endType === "after_count" && recurring.endCount ? (
                <>
                  <span className="text-muted-foreground">
                    {recurring.invoicesGenerated} of {recurring.endCount}{" "}
                    invoices
                  </span>
                  <span className="text-muted-foreground">
                    {recurring.endCount - recurring.invoicesGenerated} remaining
                  </span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">No end date</span>
                  <span className="text-lg leading-none">∞</span>
                </>
              )}
            </div>
          </div>
        )}

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
                <Button
                  variant="secondary"
                  className="size-[38px] hover:bg-secondary shrink-0"
                  onClick={() => {
                    if (downloadUrl) {
                      downloadFile(downloadUrl, `${invoiceNumber}.pdf`);
                    }
                  }}
                  disabled={!downloadUrl}
                >
                  <div>
                    <Icons.ArrowCoolDown className="size-4" />
                  </div>
                </Button>
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
    </div>
  );
}
