"use client";

import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Skeleton } from "@midday/ui/skeleton";
import { Spinner } from "@midday/ui/spinner";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNotificationDescription } from "@/components/notification-center/notification-descriptions";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { type Activity, getMetadata } from "@/hooks/use-notifications";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { getActivityIcon } from "@/utils/activity-utils";

// ---------------------------------------------------------------------------
// Grouping — merge consecutive same-type activity records
// ---------------------------------------------------------------------------

type ActivityGroup = {
  key: string;
  type: string;
  activities: Activity[];
};

const NEVER_GROUP = new Set([
  "inbox_auto_matched",
  "inbox_needs_review",
  "inbox_cross_currency_matched",
  "inbox_match_confirmed",
  "invoice_paid",
  "invoice_overdue",
  "invoice_created",
  "invoice_sent",
  "invoice_scheduled",
  "invoice_reminder_sent",
  "invoice_cancelled",
  "invoice_refunded",
  "invoice_duplicated",
  "draft_invoice_created",
  "customer_created",
  "tracker_entry_created",
  "tracker_project_created",
]);

function groupConsecutive(activities: Activity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];

  for (const activity of activities) {
    const last = groups[groups.length - 1];
    if (
      last &&
      last.type === activity.type &&
      !NEVER_GROUP.has(activity.type)
    ) {
      last.activities.push(activity);
    } else {
      groups.push({
        key: activity.id,
        type: activity.type,
        activities: [activity],
      });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Aggregate summary for grouped items
// ---------------------------------------------------------------------------

type UseI18nReturn = ReturnType<typeof useI18n>;

function getGroupSummary(
  group: ActivityGroup,
  t: UseI18nReturn,
): string | null {
  switch (group.type) {
    case "inbox_new": {
      const total = group.activities.reduce(
        (sum, a) => sum + (getMetadata(a).totalCount || 1),
        0,
      );
      const latest = getMetadata(group.activities[0]!);
      const type = latest.type;
      const provider = latest.provider ?? "";

      switch (type) {
        case "email":
          return t("notifications.inbox_new.type.email", { count: total });
        case "sync":
          return t("notifications.inbox_new.type.sync", {
            count: total,
            provider,
          } as any);
        case "slack":
          return t("notifications.inbox_new.type.slack", { count: total });
        case "upload":
          return t("notifications.inbox_new.type.upload", { count: total });
        default:
          return t("notifications.inbox_new.title", { count: total });
      }
    }

    case "transactions_created": {
      const total = group.activities.reduce(
        (sum, a) => sum + (getMetadata(a).count || 1),
        0,
      );
      if (total <= 5) {
        return t("notifications.transactions_created.title", { count: total });
      }
      return t("notifications.transactions_created.title_many", {
        count: total,
      });
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

export function ActivityFeedCard() {
  const trpc = useTRPC();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      trpc.notifications.list.infiniteQueryOptions(
        { maxPriority: 3, pageSize: 20, status: ["unread", "read"] },
        {
          getNextPageParam: (lastPage) => lastPage.meta.cursor,
        },
      ),
    );

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="border bg-background border-border p-6 pb-0 flex flex-col h-full min-h-0 relative overflow-hidden">
      <div className="mb-4 shrink-0">
        <h3 className="text-sm font-normal text-muted-foreground">Activity</h3>
      </div>

      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <ActivityTimelineSkeleton />
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full flex-col gap-1">
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/60">
              Activity will appear here as it happens
            </p>
          </div>
        ) : (
          <div className="absolute inset-0">
            <ScrollArea className="h-full" hideScrollbar>
              <ActivityTimeline activities={notifications} />
              <div ref={sentinelRef} className="h-6" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Spinner size={14} />
                </div>
              )}
            </ScrollArea>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}

const SKELETON_WIDTHS = ["70%", "90%", "60%", "80%", "55%", "75%", "85%", "65%", "50%", "70%"];

function ActivityTimelineSkeleton() {
  return (
    <div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="relative flex items-start gap-3">
          <div className="relative z-10 mt-0.5 shrink-0">
            <Skeleton className="h-[30px] w-[30px] rounded-full" />
          </div>
          <div className="flex-1 min-w-0 pb-4 pt-1">
            <Skeleton className="h-3 mb-2" style={{ width: SKELETON_WIDTHS[i] }} />
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const groups = useMemo(() => groupConsecutive(activities), [activities]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-[14px] bottom-0 w-px border-l border-dashed border-border" />

      {groups.map((group) =>
        group.activities.length === 1 ? (
          <TimelineItem key={group.key} activity={group.activities[0]!} />
        ) : (
          <GroupedTimelineItem
            key={group.key}
            group={group}
            isExpanded={expanded.has(group.key)}
            onToggle={() => toggle(group.key)}
          />
        ),
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grouped timeline item
// ---------------------------------------------------------------------------

function GroupedTimelineItem({
  group,
  isExpanded,
  onToggle,
}: {
  group: ActivityGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const t = useI18n();
  const latest = group.activities[0]!;

  const summary = getGroupSummary(group, t);
  const fallbackDescription = useActivityDescription(latest);

  const label = summary ?? fallbackDescription;
  const showBadge = !summary;

  return (
    <div>
      <div className="relative flex items-start gap-3">
        <div className="relative z-10 mt-0.5 shrink-0">
          <div className="h-[30px] w-[30px] flex items-center justify-center rounded-full bg-background border border-border">
            {getActivityIcon(group.type, "size-3.5")}
          </div>
        </div>

        <div className="flex-1 min-w-0 pb-2 pt-0.5">
          <button
            type="button"
            onClick={onToggle}
            className="w-full text-left"
          >
            <p className="text-[13px] text-primary">
              <span>{label}</span>
              {showBadge && (
                <span className="text-[11px] text-muted-foreground/60 ml-1">
                  +{group.activities.length - 1}
                </span>
              )}
              <Icons.ChevronDown
                className={`size-3 text-muted-foreground/60 inline-block ml-1 align-middle transition-transform ${isExpanded ? "" : "-rotate-90"}`}
              />
            </p>
            <time className="text-[11px] text-muted-foreground tabular-nums">
              {formatDistanceToNow(new Date(latest.createdAt), {
                addSuffix: false,
              })}
            </time>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-[42px]">
          {group.activities.map((activity) => (
            <ChildTimelineItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared hooks
// ---------------------------------------------------------------------------

function useActivityNavigate(activity: Activity) {
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setInboxParams } = useInboxParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setDocumentParams } = useDocumentParams();
  const { setParams: setTrackerParams } = useTrackerParams();

  const metadata = getMetadata(activity);
  const recordId = metadata.recordId as string | undefined;

  return useCallback(() => {
    try {
      switch (activity.type) {
        case "invoice_paid":
        case "invoice_overdue":
        case "invoice_created":
        case "invoice_sent":
        case "invoice_scheduled":
        case "invoice_reminder_sent":
        case "invoice_cancelled":
        case "invoice_refunded":
        case "invoice_duplicated":
        case "draft_invoice_created":
          if (recordId)
            setInvoiceParams({ invoiceId: recordId, type: "details" });
          break;

        case "transactions_created":
        case "transactions_enriched":
        case "transactions_categorized":
        case "transactions_assigned":
        case "transactions_exported":
        case "transaction_attachment_created":
        case "transaction_category_created":
          if (recordId) setTransactionParams({ transactionId: recordId });
          break;

        case "inbox_new":
        case "inbox_needs_review":
        case "inbox_auto_matched":
        case "inbox_cross_currency_matched":
        case "inbox_match_confirmed":
          if (metadata.inboxId)
            setInboxParams({ inboxId: metadata.inboxId, type: "details" });
          break;

        case "recurring_series_started":
        case "recurring_series_completed":
          if (metadata.invoiceId)
            setInvoiceParams({
              invoiceId: metadata.invoiceId,
              type: "details",
            });
          else if (recordId)
            setInvoiceParams({ invoiceId: recordId, type: "details" });
          break;

        case "recurring_series_paused":
        case "recurring_invoice_upcoming":
          if (recordId)
            setInvoiceParams({ invoiceId: recordId, type: "details" });
          break;

        case "customer_created":
          if (recordId)
            setCustomerParams({ customerId: recordId, details: true });
          break;

        case "tracker_entry_created":
          if (metadata.projectId)
            setTrackerParams({ projectId: metadata.projectId, update: true });
          break;

        case "tracker_project_created":
          if (metadata.projectId || recordId)
            setTrackerParams({
              projectId: metadata.projectId || recordId,
              update: true,
            });
          break;

        case "document_uploaded":
        case "document_processed":
          if (recordId) setDocumentParams({ documentId: recordId });
          break;
      }
    } catch {
      // silently ignore navigation errors
    }
  }, [
    activity.type,
    recordId,
    metadata,
    setInvoiceParams,
    setTransactionParams,
    setInboxParams,
    setCustomerParams,
    setDocumentParams,
    setTrackerParams,
  ]);
}

function useActivityDescription(activity: Activity) {
  const t = useI18n();
  const { data: user } = useUserQuery();
  return getNotificationDescription(
    activity.type,
    getMetadata(activity),
    user,
    t,
  );
}

// ---------------------------------------------------------------------------
// Individual item renderers
// ---------------------------------------------------------------------------

function ChildTimelineItem({ activity }: { activity: Activity }) {
  const description = useActivityDescription(activity);
  const navigate = useActivityNavigate(activity);

  return (
    <button
      type="button"
      onClick={navigate}
      className="w-full text-left pb-2"
    >
      <p className="text-[12px] text-primary/70">{description}</p>
      <time className="text-[11px] text-muted-foreground tabular-nums">
        {formatDistanceToNow(new Date(activity.createdAt), {
          addSuffix: false,
        })}
      </time>
    </button>
  );
}

function TimelineItem({ activity }: { activity: Activity }) {
  const description = useActivityDescription(activity);
  const navigate = useActivityNavigate(activity);

  return (
    <div className="relative flex items-start gap-3">
      <div className="relative z-10 mt-0.5 shrink-0">
        <div className="h-[30px] w-[30px] flex items-center justify-center rounded-full bg-background border border-border">
          {getActivityIcon(activity.type, "size-3.5")}
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-4 pt-0.5">
        <button type="button" onClick={navigate} className="w-full text-left">
          <p className="text-[13px] text-primary">{description}</p>
          <time className="text-[11px] text-muted-foreground tabular-nums">
            {formatDistanceToNow(new Date(activity.createdAt), {
              addSuffix: false,
            })}
          </time>
        </button>
      </div>
    </div>
  );
}
