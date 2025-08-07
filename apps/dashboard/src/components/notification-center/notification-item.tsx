import { useI18n } from "@/locales/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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

  const getNotificationType = (activityType: string): string => {
    switch (activityType) {
      case "transactions_created":
        return "transactions";
      case "inbox_new":
        return "inbox";
      default:
        return "default";
    }
  };

  const getNotificationDescription = (
    activityType: string,
    metadata: Record<string, any>,
  ): string => {
    switch (activityType) {
      case "transactions_created": {
        const count = metadata?.count || metadata?.transactionCount || 1;
        if (count <= 5) {
          return t("notifications.transactions_created.title", { count });
        }
        return t("notifications.transactions_created.title_many", { count });
      }
      case "inbox_new": {
        // Access the data directly from metadata
        const count = metadata?.totalCount || 1;
        const provider = metadata?.provider;
        const syncType = metadata?.syncType;

        // Determine which translation key to use based on context
        let translationKey: string;
        if (provider && syncType === "automatic") {
          translationKey = "notifications.inbox_new.connected_auto";
        } else if (provider) {
          translationKey = "notifications.inbox_new.provider_manual";
        } else if (syncType === "automatic") {
          translationKey = "notifications.inbox_new.connected_generic";
        } else {
          translationKey = "notifications.inbox_new.fallback";
        }

        return t(translationKey, { count, provider });
      }
      default:
        return t("notifications.default.title");
    }
  };

  const type = getNotificationType(activity.type);
  const description = getNotificationDescription(
    activity.type,
    activity.metadata,
  );
  const recordId = activity.metadata?.recordId || null;
  const from = activity.metadata?.from || null;
  const to = activity.metadata?.to || null;

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
                {formatDistanceToNow(new Date(activity.createdAt))} ago
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
                title="Archive notification"
              >
                <Icons.Inventory2 />
              </Button>
            </div>
          )}
        </div>
      );

    case "inbox":
      return (
        <div
          className={cn(
            "flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary",
            activity.status === "unread" && "bg-blue-50/50 dark:bg-blue-950/20",
          )}
        >
          <Link
            className="flex items-between justify-between space-x-4 "
            onClick={() => setOpen(false)}
            href="/inbox"
          >
            <div>
              <div
                className={`h-9 w-9 flex items-center justify-center space-y-0 border rounded-full ${activity.status === "unread" ? "border-blue-200 dark:border-blue-800" : ""}`}
              >
                <Icons.Inbox2 />
              </div>
            </div>
            <div>
              <p
                className={`text-sm ${activity.status === "unread" ? "font-medium" : ""}`}
              >
                {description}
              </p>
              <span className="text-xs text-[#606060]">
                {formatDistanceToNow(new Date(activity.createdAt))} ago
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
                title="Archive notification"
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
                {formatDistanceToNow(new Date(activity.createdAt))} ago
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
                title="Archive notification"
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
                {formatDistanceToNow(new Date(activity.createdAt))} ago
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
                title="Archive notification"
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
