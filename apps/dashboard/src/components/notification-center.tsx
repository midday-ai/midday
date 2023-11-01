"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function EmptyState({ description }) {
  return (
    <div className="h-[460px] flex items-center justify-center flex-col space-y-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Icons.Inbox size={18} />
      </div>
      <p className="text-[#606060] text-sm">{description}</p>
    </div>
  );
}

function TransactionNotification({
  id,
  setOpen,
  description,
  createdAt,
  transactionId,
  markMessageAsRead,
}) {
  return (
    <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
      <Link
        className="flex flex items-between justify-between space-x-4 "
        onClick={() => setOpen(false)}
        href={`/transactions?id=${transactionId}`}
      >
        <div>
          <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
            <Icons.Transactions />
          </div>
        </div>
        <div>
          <p className="text-sm">{description}</p>
          <span className="text-xs text-[#606060]">
            {formatDistanceToNow(new Date(createdAt))} ago
          </span>
        </div>
      </Link>
      {markMessageAsRead && (
        <div>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-transparent hover:bg-[#1A1A1A]"
            onClick={() => markMessageAsRead(id)}
          >
            <Icons.Inventory2 />
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationCenter() {
  const hasSeen = useRef(false);
  const [isOpen, setOpen] = useState(false);
  const {
    hasUnseenNotificaitons,
    notifications,
    markMessageAsRead,
    markAllMessagesAsSeen,
    markAllMessagesAsRead,
  } = useNotifications();

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  );

  const archivedNotifications = notifications.filter(
    (notification) => notification.read,
  );

  useEffect(() => {
    if (isOpen && hasUnseenNotificaitons) {
      markAllMessagesAsSeen();
    }
  }, [hasUnseenNotificaitons, isOpen]);

  return (
    <Popover onOpenChange={setOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 flex items-center relative"
        >
          {hasUnseenNotificaitons && (
            <div className="w-1.5 h-1.5 bg-[#d98d00] rounded-full absolute top-0 right-0" />
          )}
          <Icons.Notifications size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="rounded-xl h-[535px] w-[400px] mr-7 p-0 overflow-hidden relative"
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

          <Link
            href="/settings/notifications"
            className="absolute right-[11px] top-1.5"
          >
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-ransparent hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Icons.SettingsCog className="text-[#606060]" size={16} />
            </Button>
          </Link>

          <TabsContent value="inbox" className="relative mt-0">
            {!unreadNotifications.length && (
              <EmptyState description="No new notifications" />
            )}

            {unreadNotifications.length > 0 && (
              <ScrollArea className="pb-12 h-[485px]">
                <div className="divide-y">
                  {unreadNotifications.map((notification) => {
                    return (
                      <TransactionNotification
                        key={notification.id}
                        id={notification.id}
                        markMessageAsRead={markMessageAsRead}
                        setOpen={setOpen}
                        description={notification.payload.description}
                        createdAt={notification.createdAt}
                        transactionId={notification.payload.transactionId}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {unreadNotifications.length > 0 && (
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
            {!archivedNotifications.length && (
              <EmptyState description="Nothing in the archive" />
            )}

            {archivedNotifications.length > 0 && (
              <ScrollArea className="h-[490px]">
                <div className="divide-y">
                  {archivedNotifications.map((notification) => {
                    return (
                      <TransactionNotification
                        key={notification.id}
                        setOpen={setOpen}
                        description={notification.payload.description}
                        createdAt={notification.createdAt}
                        transactionId={notification.payload.transactionId}
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
