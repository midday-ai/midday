"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Skeleton } from "@midday/ui/skeleton";
import { Spinner } from "@midday/ui/spinner";
import { formatAmount } from "@midday/utils/format";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BankLogo } from "@/components/bank-logo";
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
import { getWebsiteLogo } from "@/utils/logos";

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
// Contextual activity icon — provider/bank/customer logos with generic fallback
// ---------------------------------------------------------------------------

const INBOX_PROVIDER_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  gmail: Icons.Gmail,
  outlook: Icons.Outlook,
  slack: Icons.Slack,
  whatsapp: Icons.WhatsApp,
};

function ActivityIcon({ activity }: { activity: Activity }) {
  const metadata = getMetadata(activity);

  if (activity.type === "inbox_new") {
    const provider = (metadata.provider as string) ?? "";
    const type = (metadata.type as string) ?? "";

    const Icon = INBOX_PROVIDER_ICONS[provider] ?? INBOX_PROVIDER_ICONS[type];

    if (Icon) {
      return (
        <div className="h-[30px] w-[30px] flex items-center justify-center rounded-full bg-background border border-border">
          <Icon className="size-3.5" />
        </div>
      );
    }
  }

  if (activity.type === "transactions_created") {
    const bankLogoUrl = metadata.bankLogoUrl as string | undefined;
    if (bankLogoUrl) {
      return <BankLogo src={bankLogoUrl} alt="Bank" size={30} />;
    }
  }

  if (
    activity.type.startsWith("invoice_") ||
    activity.type === "draft_invoice_created" ||
    activity.type.startsWith("recurring_")
  ) {
    const website = metadata.customerWebsite as string | undefined;
    if (website) {
      const logoUrl = getWebsiteLogo(website);
      return (
        <Avatar
          style={{ width: 30, height: 30 }}
          className="border border-border"
        >
          <AvatarImage
            src={logoUrl}
            alt={String(metadata.customerName ?? "Customer")}
            className="object-contain bg-white"
          />
          <AvatarFallback className="text-[10px]">
            {getActivityIcon(activity.type, "size-3.5")}
          </AvatarFallback>
        </Avatar>
      );
    }
  }

  if (activity.type === "customer_created") {
    const website = metadata.website as string | undefined;
    if (website) {
      const logoUrl = getWebsiteLogo(website);
      return (
        <Avatar
          style={{ width: 30, height: 30 }}
          className="border border-border"
        >
          <AvatarImage
            src={logoUrl}
            alt={String(metadata.customerName ?? "Customer")}
            className="object-contain bg-white"
          />
          <AvatarFallback className="text-[10px]">
            {getActivityIcon(activity.type, "size-3.5")}
          </AvatarFallback>
        </Avatar>
      );
    }
  }

  return (
    <div className="h-[30px] w-[30px] flex items-center justify-center rounded-full bg-background border border-border">
      {getActivityIcon(activity.type, "size-3.5")}
    </div>
  );
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

const SKELETON_WIDTHS = [
  "70%",
  "90%",
  "60%",
  "80%",
  "55%",
  "75%",
  "85%",
  "65%",
  "50%",
  "70%",
];

function ActivityTimelineSkeleton() {
  return (
    <div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="relative flex items-start gap-3">
          <div className="relative z-10 mt-0.5 shrink-0">
            <Skeleton className="h-[30px] w-[30px] rounded-full" />
          </div>
          <div className="flex-1 min-w-0 pb-4 pt-1">
            <Skeleton
              className="h-3 mb-2"
              style={{ width: SKELETON_WIDTHS[i] }}
            />
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
          <ActivityIcon activity={latest} />
        </div>

        <div className="flex-1 min-w-0 pb-2 pt-0.5">
          <button type="button" onClick={onToggle} className="w-full text-left">
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

function canNavigate(activity: Activity): boolean {
  const metadata = getMetadata(activity);
  const recordId = metadata.recordId as string | undefined;

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
      return !!recordId;

    case "transactions_created":
      return !!(recordId || metadata.dateRange);

    case "transactions_enriched":
    case "transactions_categorized":
    case "transactions_assigned":
    case "transactions_exported":
    case "transaction_attachment_created":
    case "transaction_category_created":
      return !!recordId;

    case "inbox_new":
      return true;

    case "inbox_needs_review":
    case "inbox_auto_matched":
    case "inbox_cross_currency_matched":
    case "inbox_match_confirmed":
      return !!metadata.inboxId;

    case "recurring_series_started":
    case "recurring_series_completed":
      return !!(metadata.invoiceId || recordId);

    case "recurring_series_paused":
    case "recurring_invoice_upcoming":
      return !!recordId;

    case "customer_created":
      return !!recordId;

    case "tracker_entry_created":
      return !!metadata.projectId;

    case "tracker_project_created":
      return !!(metadata.projectId || recordId);

    case "document_uploaded":
    case "document_processed":
      return !!recordId;

    default:
      return false;
  }
}

function useActivityNavigate(activity: Activity) {
  const router = useRouter();
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
          if (recordId) {
            setTransactionParams({ transactionId: recordId });
          } else if (metadata.dateRange) {
            router.push(
              `/transactions?start=${metadata.dateRange.from}&end=${metadata.dateRange.to}`,
            );
          }
          break;

        case "transactions_enriched":
        case "transactions_categorized":
        case "transactions_assigned":
        case "transactions_exported":
        case "transaction_attachment_created":
        case "transaction_category_created":
          if (recordId) setTransactionParams({ transactionId: recordId });
          break;

        case "inbox_new":
          router.push("/inbox");
          break;

        case "inbox_needs_review":
        case "inbox_auto_matched":
        case "inbox_cross_currency_matched":
        case "inbox_match_confirmed":
          if (metadata.inboxId)
            setInboxParams({ inboxId: metadata.inboxId, type: "details" });
          else router.push("/inbox");
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
    router,
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

function useChildDescription(activity: Activity): string {
  const t = useI18n();
  const { data: user } = useUserQuery();
  const metadata = getMetadata(activity);

  if (activity.type === "inbox_new") {
    const count = metadata.totalCount || 1;
    const type = metadata.type;
    const provider = metadata.provider ?? "";
    if (count === 1) {
      if (type === "sync")
        return `Synced from ${provider || "connected account"}`;
      if (type === "email") return "Received via email";
      if (type === "slack") return "Received from Slack";
      if (type === "upload") return "Uploaded";
      return "New document";
    }
    if (type === "sync")
      return `${count} synced from ${provider || "connected account"}`;
    if (type === "email") return `${count} received via email`;
    if (type === "slack") return `${count} from Slack`;
    if (type === "upload") return `${count} uploaded`;
    return `${count} documents`;
  }

  if (activity.type === "transactions_created") {
    const count = metadata.count || 1;
    const transaction = metadata.transaction;

    if (count === 1 && transaction) {
      const formattedAmount =
        formatAmount({
          currency: transaction.currency,
          amount: transaction.amount,
          locale: user?.locale || "en-US",
        }) || `${transaction.amount} ${transaction.currency}`;
      return `${transaction.name} ${formattedAmount}`;
    }
    return `${count} transactions`;
  }

  return getNotificationDescription(activity.type, metadata, user, t);
}

function ChildTimelineItem({ activity }: { activity: Activity }) {
  const description = useChildDescription(activity);
  const navigate = useActivityNavigate(activity);
  const clickable = canNavigate(activity);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? navigate : undefined}
      className={`w-full text-left pb-2 ${clickable ? "cursor-pointer" : "cursor-default"}`}
    >
      <p className="text-[12px] text-primary/70">{description}</p>
      <time className="text-[11px] text-muted-foreground tabular-nums">
        {formatDistanceToNow(new Date(activity.createdAt), {
          addSuffix: false,
        })}
      </time>
    </div>
  );
}

function TimelineItem({ activity }: { activity: Activity }) {
  const description = useActivityDescription(activity);
  const navigate = useActivityNavigate(activity);
  const clickable = canNavigate(activity);

  return (
    <div className="relative flex items-start gap-3">
      <div className="relative z-10 mt-0.5 shrink-0">
        <ActivityIcon activity={activity} />
      </div>

      <div className="flex-1 min-w-0 pb-4 pt-0.5">
        <div
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={clickable ? navigate : undefined}
          className={`w-full text-left ${clickable ? "cursor-pointer" : "cursor-default"}`}
        >
          <p className="text-[13px] text-primary">{description}</p>
          <time className="text-[11px] text-muted-foreground tabular-nums">
            {formatDistanceToNow(new Date(activity.createdAt), {
              addSuffix: false,
            })}
          </time>
        </div>
      </div>
    </div>
  );
}
