import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
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

  const getNotificationType = (activityType: string): string => {
    switch (activityType) {
      case "transactions_created":
        return "transactions";
      case "inbox_new":
        return "inbox";
      case "invoice_paid":
      case "invoice_overdue":
      case "invoice_scheduled":
      case "invoice_sent":
      case "invoice_reminder_sent":
      case "invoice_cancelled":
      case "invoice_created":
        return "invoice";
      default:
        return "default";
    }
  };

  const recordId = activity.metadata?.recordId || null;
  const from = activity.metadata?.from || null;
  const to = activity.metadata?.to || null;

  const type = getNotificationType(activity.type);

  const description = getNotificationDescription(
    activity.type,
    activity.metadata,
    user,
    t,
  );

  switch (type) {
    case "transactions":
      return (
        <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
          <Link
            className="flex items-between justify-between space-x-4"
            onClick={() => setOpen(false)}
            href={`/transactions?start=${from}&end=${to}`}
          >
            <div>
              <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
                <Icons.Transactions />
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
          </Link>
          {markMessageAsRead && (
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
          )}
        </div>
      );

    case "inbox":
      return (
        <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
          <Link
            className="flex items-between justify-between space-x-4 "
            onClick={() => setOpen(false)}
            href="/inbox"
          >
            <div>
              <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
                <Icons.Inbox2 />
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
          </Link>

          {markMessageAsRead && (
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
          )}
        </div>
      );

    case "match":
      return (
        <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
          <Link
            className="flex items-between justify-between space-x-4 "
            onClick={() => setOpen(false)}
            href={`/transactions?id=${recordId}`}
          >
            <div>
              <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
                <Icons.Match />
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
          </Link>
          {markMessageAsRead && (
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
          )}
        </div>
      );

    case "invoice":
      return (
        <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
          <Link
            className="flex items-between justify-between space-x-4 "
            onClick={() => setOpen(false)}
            href={`/invoices?invoiceId=${recordId}&type=details`}
          >
            <div>
              <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
                <Icons.Invoice />
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
          </Link>
          {markMessageAsRead && (
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
          )}
        </div>
      );

    default:
      return null;
  }
}
