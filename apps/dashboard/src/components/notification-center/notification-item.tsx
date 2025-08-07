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
  const getNotificationType = (activityType: string): string => {
    switch (activityType) {
      case "transactions_created":
      case "transactions_enriched":
        return "transactions";
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
        const count = metadata?.transactionCount || 1;
        return `${count} new transaction${count > 1 ? "s" : ""} created`;
      }
      case "transactions_enriched": {
        const enrichedCount = metadata?.enrichedCount || 1;
        const totalCount = metadata?.transactionCount || enrichedCount;
        return `${enrichedCount} of ${totalCount} transactions enriched`;
      }
      default:
        return "New activity";
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
            href={`/inbox?id=${recordId}`}
          >
            <div>
              <div
                className={`h-9 w-9 flex items-center justify-center space-y-0 border rounded-full ${activity.status === "unread" ? "border-blue-200 dark:border-blue-800" : ""}`}
              >
                <Icons.Email />
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
