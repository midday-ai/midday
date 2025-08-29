"use client";

import { useInboxParams } from "@/hooks/use-inbox-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
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
  "inbox_needs_review",
  "inbox_auto_matched",
  "inbox_cross_currency_matched",
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
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setInboxParams } = useInboxParams();
  const router = useRouter();

  const isClickable = isNotificationClickable(activityType);

  const handleClick = () => {
    onNavigate?.();

    try {
      switch (activityType) {
        case "invoice_paid":
        case "invoice_overdue":
        case "invoice_created":
        case "invoice_sent":
        case "invoice_scheduled":
        case "invoice_reminder_sent":
        case "invoice_cancelled":
          setInvoiceParams({ invoiceId: recordId!, type: "details" });
          break;

        case "transactions_created":
          if (metadata?.recordId) {
            setTransactionParams({ transactionId: recordId! });
          } else if (metadata?.dateRange) {
            router.push(
              `/transactions?start=${metadata.dateRange.from}&end=${metadata.dateRange.to}`,
            );
          }
          break;

        case "inbox_new":
          router.push("/inbox");
          break;

        case "inbox_needs_review":
        case "inbox_auto_matched":
        case "inbox_cross_currency_matched":
          // Use the inboxId from metadata to open the inbox details sheet
          if (metadata?.inboxId) {
            setInboxParams({ inboxId: metadata.inboxId, type: "details" });
          } else {
            // Fallback to inbox page if no inboxId
            router.push("/inbox");
          }
          break;

        default:
          console.warn(`Unhandled notification type: ${activityType}`);
      }
    } catch (error) {
      console.error(`Error navigating for ${activityType}:`, error);
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
