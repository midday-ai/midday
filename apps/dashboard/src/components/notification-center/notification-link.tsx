"use client";

import { useInboxParams } from "@/hooks/use-inbox-params";
import { useDealParams } from "@/hooks/use-deal-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const SUPPORTED_NOTIFICATION_TYPES = [
  "deal_paid",
  "deal_overdue",
  "deal_created",
  "deal_sent",
  "deal_scheduled",
  "deal_reminder_sent",
  "deal_cancelled",
  "deal_refunded",
  "transactions_created",
  "inbox_new",
  "inbox_needs_review",
  "inbox_auto_matched",
  "inbox_cross_currency_matched",
  "recurring_series_started",
  "recurring_series_completed",
  "recurring_series_paused",
  "recurring_deal_upcoming",
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
  const { setParams: setDealParams } = useDealParams();
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setInboxParams } = useInboxParams();
  const router = useRouter();

  const isClickable = isNotificationClickable(activityType);

  const handleClick = () => {
    onNavigate?.();

    try {
      switch (activityType) {
        case "deal_paid":
        case "deal_overdue":
        case "deal_created":
        case "deal_sent":
        case "deal_scheduled":
        case "deal_reminder_sent":
        case "deal_cancelled":
        case "deal_refunded":
          setDealParams({ dealId: recordId!, type: "details" });
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

        case "recurring_series_started":
        case "recurring_series_completed":
          // Open the deal details for the generated deal
          if (metadata?.dealId) {
            setDealParams({
              dealId: metadata.dealId,
              type: "details",
            });
          } else if (recordId) {
            // Fallback: open the edit recurring sheet
            setDealParams({ editRecurringId: recordId });
          }
          break;

        case "recurring_series_paused":
          // Open the edit recurring sheet to let user resume/review the series
          if (recordId) {
            setDealParams({ editRecurringId: recordId });
          }
          break;

        case "recurring_deal_upcoming":
          // Open the edit recurring sheet to let user review/modify the series
          if (recordId) {
            setDealParams({ editRecurringId: recordId });
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
