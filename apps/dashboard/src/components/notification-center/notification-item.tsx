import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { format, formatDistanceToNow } from "date-fns";
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
        return "invoice";
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
        const count = metadata?.totalCount || 1;
        const source = metadata?.source;
        const provider = metadata?.provider;

        // Use special title for uploads
        if (source === "upload") {
          return t("notifications.inbox_new.upload_title", { count });
        }

        const baseTitle = t("notifications.inbox_new.title", { count });

        if (source) {
          let sourceText = "";
          if (source === "email") {
            sourceText = t("notifications.inbox_new.source.email");
          } else if (source === "sync") {
            sourceText = t("notifications.inbox_new.source.sync", { provider });
          } else if (source === "slack") {
            sourceText = t("notifications.inbox_new.source.slack");
          } else if (source === "upload") {
            sourceText = t("notifications.inbox_new.source.upload");
          }

          return `${baseTitle} ${sourceText}`.trim();
        }

        return baseTitle;
      }
      case "invoice_paid": {
        const invoiceNumber = metadata?.invoiceNumber;
        const customerName = metadata?.customerName;
        const source = metadata?.source;
        const paidAt = metadata?.paidAt;

        if (invoiceNumber && source === "manual" && paidAt) {
          const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
          const paidDate = new Date(paidAt);
          const formattedDate = format(paidDate, userDateFormat);

          if (customerName) {
            return `Invoice ${invoiceNumber} from ${customerName} marked as paid on ${formattedDate}`;
          }
          return `Invoice ${invoiceNumber} marked as paid on ${formattedDate}`;
        }

        if (invoiceNumber && source === "manual") {
          return customerName
            ? `Invoice ${invoiceNumber} from ${customerName} marked as paid`
            : `Invoice ${invoiceNumber} marked as paid`;
        }

        return invoiceNumber
          ? `Payment received for invoice ${invoiceNumber}`
          : t("notifications.invoice_paid.title");
      }
      case "invoice_overdue": {
        const invoiceNumber = metadata?.invoiceNumber;
        return invoiceNumber
          ? `Invoice ${invoiceNumber} is now overdue`
          : t("notifications.invoice_overdue.title");
      }
      case "invoice_scheduled": {
        const invoiceNumber = metadata?.invoiceNumber;
        const scheduledAt = metadata?.scheduledAt;
        const customerName = metadata?.customerName;

        if (invoiceNumber && scheduledAt) {
          const scheduledDate = new Date(scheduledAt);
          const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
          const formattedDate = format(scheduledDate, userDateFormat);
          const formattedTime = format(scheduledDate, "HH:mm");

          if (customerName) {
            return `Invoice ${invoiceNumber} scheduled to be sent to ${customerName} on ${formattedDate} at ${formattedTime}`;
          }
          return `Invoice ${invoiceNumber} scheduled for ${formattedDate} at ${formattedTime}`;
        }
        if (invoiceNumber) {
          return `Invoice ${invoiceNumber} has been scheduled`;
        }
        return t("notifications.invoice_scheduled.title");
      }
      case "invoice_sent": {
        const invoiceNumber = metadata?.invoiceNumber;
        const customerName = metadata?.customerName;
        if (invoiceNumber && customerName) {
          return `Invoice ${invoiceNumber} sent to ${customerName}`;
        }
        if (invoiceNumber) {
          return `Invoice ${invoiceNumber} has been sent`;
        }
        return t("notifications.invoice_sent.title");
      }
      case "invoice_reminder_sent": {
        const invoiceNumber = metadata?.invoiceNumber;
        const customerName = metadata?.customerName;
        if (invoiceNumber && customerName) {
          return `Payment reminder sent to ${customerName} for invoice ${invoiceNumber}`;
        }
        if (invoiceNumber) {
          return `Payment reminder sent for invoice ${invoiceNumber}`;
        }
        return t("notifications.invoice_reminder_sent.title");
      }

      case "invoice_cancelled": {
        const invoiceNumber = metadata?.invoiceNumber;
        const customerName = metadata?.customerName;

        if (invoiceNumber && customerName) {
          return `Invoice ${invoiceNumber} for ${customerName} has been cancelled`;
        }
        if (invoiceNumber) {
          return `Invoice ${invoiceNumber} has been cancelled`;
        }
        return t("notifications.invoice_cancelled.title");
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
                className={cn(
                  "h-9 w-9 flex items-center justify-center space-y-0 border rounded-full",
                  activity.status === "unread" &&
                    "border-blue-200 dark:border-blue-800",
                )}
              >
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
