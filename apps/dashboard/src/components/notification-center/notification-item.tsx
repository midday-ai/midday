"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { formatDistanceToNow } from "date-fns";
import {
  type Activity,
  getMetadata,
  getMetadataProperty,
} from "@/hooks/use-notifications";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { getNotificationDescription } from "./notification-descriptions";
import { NotificationLink } from "./notification-link";

interface NotificationItemProps {
  id: string;
  setOpen: (open: boolean) => void;
  activity: Activity;
  markMessageAsRead?: (id: string) => void;
}

export function NotificationItem({
  id,
  setOpen,
  activity,
  markMessageAsRead,
}: NotificationItemProps) {
  const t = useI18n();
  const { data: user } = useUserQuery();

  const recordId = getMetadataProperty(activity, "recordId");
  const metadata = getMetadata(activity);

  const getNotificationIcon = (activityType: string) => {
    if (activityType.startsWith("recurring_"))
      return <Icons.Repeat className="size-4" />;
    if (activityType.startsWith("invoice_"))
      return <Icons.Invoice className="size-4" />;
    if (activityType.startsWith("transaction"))
      return <Icons.Transactions className="size-4" />;
    if (activityType === "inbox_new")
      return <Icons.Inbox2 className="size-4" />;
    if (activityType.startsWith("inbox_") && activityType.includes("matched"))
      return <Icons.Match className="size-4" />;
    if (activityType === "inbox_needs_review")
      return <Icons.AlertCircle className="size-4" />;
    if (activityType === "match") return <Icons.Match className="size-4" />;
    if (activityType === "insight_ready")
      return <Icons.Insights className="size-4" />;
    return <Icons.Notifications className="size-4" />;
  };

  const description = getNotificationDescription(
    activity.type,
    metadata,
    user,
    t,
  );

  const notificationContent = (
    <>
      <div>
        <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
          {getNotificationIcon(activity.type)}
        </div>
      </div>
      <div>
        <p
          className={cn(
            "text-sm",
            activity.status === "unread" && "font-medium",
          )}
        >
          {description}
        </p>
        <span className="text-xs text-[#606060]">
          {t("notifications.time_ago", {
            time: formatDistanceToNow(new Date(activity.createdAt)),
          })}
        </span>
      </div>
    </>
  );

  const actionButton = markMessageAsRead && (
    <div>
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full bg-transparent dark:hover:bg-[#1A1A1A] hover:bg-[#F6F6F3]"
        onClick={() => markMessageAsRead(id)}
        title={t("notifications.archive_button")}
      >
        <Icons.Inventory2 />
      </Button>
    </div>
  );

  return (
    <NotificationLink
      activityType={activity.type}
      recordId={recordId}
      metadata={metadata}
      onNavigate={() => setOpen(false)}
      className="flex items-between space-x-4 flex-1 text-left"
      actionButton={actionButton}
    >
      {notificationContent}
    </NotificationLink>
  );
}
