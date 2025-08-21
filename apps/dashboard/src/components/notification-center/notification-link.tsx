"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const SUPPORTED_NOTIFICATION_TYPES = [
  "invoice_paid",
  "invoice_overdue",
  "invoice_created",
  "invoice_sent",
  "invoice_scheduled",
  "invoice_reminder_sent",
  "invoice_cancelled",
  "transactions_created",
  "inbox_new",
  "match",
];

export function isNotificationClickable(activityType: string): boolean {
  return SUPPORTED_NOTIFICATION_TYPES.includes(activityType);
}

interface NotificationLinkProps {
  activityType: string;
  recordId: string | null | undefined;
  metadata?: Record<string, any>;
  onNavigate?: () => void;
  children: ReactNode;
  className?: string;
  actionButton?: ReactNode;
}

export function NotificationLink({
  activityType,
  recordId,
  metadata,
  onNavigate,
  children,
  className,
  actionButton,
}: NotificationLinkProps) {
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const router = useRouter();

  const isClickable = isNotificationClickable(activityType);

  const handleClick = () => {
    onNavigate?.();

    const linkBuilders: Record<
      string,
      (recordId: string, metadata?: Record<string, any>) => void
    > = {
      invoice_paid: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      invoice_overdue: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      invoice_created: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      invoice_sent: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      invoice_scheduled: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      invoice_reminder_sent: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      invoice_cancelled: (recordId) =>
        setInvoiceParams({ invoiceId: recordId, type: "details" }),
      transactions_created: (recordId, metadata) => {
        if (metadata?.from && metadata?.to) {
          router.push(
            `/transactions?start=${metadata.from}&end=${metadata.to}`,
          );
        } else {
          router.push(`/transactions?id=${recordId}`);
        }
      },
      inbox_new: () => router.push("/inbox"),
      match: (recordId) => router.push(`/transactions?id=${recordId}`),
    };

    const builder = linkBuilders[activityType];

    if (builder) {
      try {
        builder(recordId || "", metadata);
      } catch (error) {
        console.error(`Error navigating for ${activityType}:`, error);
      }
    }
  };

  if (isClickable) {
    return (
      <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
        <button className={className} onClick={handleClick} type="button">
          {children}
        </button>
        {actionButton}
      </div>
    );
  }

  // Non-clickable notification
  return (
    <div className="flex items-between space-x-4 px-3 py-3">
      <div className="flex items-between justify-between space-x-4 flex-1">
        {children}
      </div>
      {actionButton}
    </div>
  );
}
