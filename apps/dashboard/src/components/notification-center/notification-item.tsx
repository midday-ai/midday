import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import {
  getNotificationLink,
  isNotificationClickable,
} from "@/utils/notification-links";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getNotificationDescription } from "./notification-descriptions";

interface NotificationItemProps {
  id: string;
  setOpen: (open: boolean) => void;
  activity: any;
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

  const recordId = activity.metadata?.recordId;
  const notificationLink = getNotificationLink(
    activity.type,
    recordId,
    activity.metadata,
  );

  const isClickable = isNotificationClickable(
    activity.type,
    recordId,
    activity.metadata,
  );

  const getNotificationIcon = (activityType: string) => {
    if (activityType.startsWith("invoice_")) return <Icons.Invoice />;
    if (activityType.startsWith("transaction")) return <Icons.Transactions />;
    if (activityType === "inbox_new") return <Icons.Inbox2 />;
    if (activityType === "match") return <Icons.Match />;
    return <Icons.Bell />; // Default icon
  };

  const description = getNotificationDescription(
    activity.type,
    activity.metadata,
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

  if (isClickable && notificationLink) {
    return (
      <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
        <Link
          className="flex items-between justify-between space-x-4 flex-1"
          onClick={() => setOpen(false)}
          href={notificationLink.href}
        >
          {notificationContent}
        </Link>
        {actionButton}
      </div>
    );
  }

  // Non-clickable notification
  return (
    <div className="flex items-between justify-between space-x-4 px-3 py-3">
      <div className="flex items-between justify-between space-x-4 flex-1">
        {notificationContent}
      </div>
      {actionButton}
    </div>
  );
}
