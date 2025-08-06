"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";

function EmptyState({ description }: { description: string }) {
  return (
    <div className="h-[460px] flex items-center justify-center flex-col space-y-4">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
        <Icons.Inbox className="w-[18px] h-[18px]" />
      </div>
      <p className="text-[#606060] text-sm">{description}</p>
    </div>
  );
}

function NotificationItem({
  id,
  setOpen,
  activity,
  markMessageAsRead,
}: {
  id: string;
  setOpen: (open: boolean) => void;
  activity: any;
  markMessageAsRead?: (id: string) => void;
}) {
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
              <p className="text-sm">{description}</p>
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
            href={`/inbox?id=${recordId}`}
          >
            <div>
              <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
                <Icons.Email />
              </div>
            </div>
            <div>
              <p className="text-sm">{description}</p>
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
              <p className="text-sm">{description}</p>
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
              <p className="text-sm">{description}</p>
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

export function NotificationCenter() {
  const [isOpen, setOpen] = useState(false);
  const {
    hasUnseenNotifications,
    notifications,
    markMessageAsRead,
    markAllMessagesAsSeen,
    markAllMessagesAsRead,
    isLoading,
  } = useNotifications();

  const unreadNotifications = notifications.filter(
    (notification) => notification.status === "unread",
  );

  const archivedNotifications = notifications.filter(
    (notification) =>
      notification.status === "read" || notification.status === "archived",
  );

  useEffect(() => {
    if (isOpen && hasUnseenNotifications) {
      markAllMessagesAsSeen();
    }
  }, [hasUnseenNotifications, isOpen]);

  return (
    <Popover onOpenChange={setOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 flex items-center relative"
        >
          {hasUnseenNotifications && (
            <div className="w-1.5 h-1.5 bg-[#FFD02B] rounded-full absolute top-0 right-0" />
          )}
          <Icons.Notifications size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="h-[535px] w-screen md:w-[400px] p-0 overflow-hidden relative"
        align="end"
        sideOffset={10}
      >
        <Tabs defaultValue="inbox">
          <TabsList className="w-full justify-start bg-transparent border-b-[1px] rounded-none py-6">
            <TabsTrigger value="inbox" className="font-normal">
              Inbox
            </TabsTrigger>
            <TabsTrigger value="archive" className="font-normal">
              Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="relative mt-0">
            {!isLoading && !unreadNotifications.length && (
              <EmptyState description="No new notifications" />
            )}

            {!isLoading && unreadNotifications.length > 0 && (
              <ScrollArea className="pb-12 h-[485px]">
                <div className="divide-y">
                  {unreadNotifications.map((notification: any) => {
                    return (
                      <NotificationItem
                        key={notification.id}
                        id={notification.id}
                        markMessageAsRead={markMessageAsRead}
                        setOpen={setOpen}
                        activity={notification}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {!isLoading && unreadNotifications.length > 0 && (
              <div className="h-12 w-full absolute bottom-0 flex items-center justify-center border-t-[1px]">
                <Button
                  variant="secondary"
                  className="bg-transparent"
                  onClick={markAllMessagesAsRead}
                >
                  Archive all
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="archive" className="mt-0">
            {!isLoading && !archivedNotifications.length && (
              <EmptyState description="Nothing in the archive" />
            )}

            {!isLoading && archivedNotifications.length > 0 && (
              <ScrollArea className="h-[490px]">
                <div className="divide-y">
                  {archivedNotifications.map((notification: any) => {
                    return (
                      <NotificationItem
                        key={notification.id}
                        id={notification.id}
                        setOpen={setOpen}
                        activity={notification}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
