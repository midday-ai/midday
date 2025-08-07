"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useEffect, useState } from "react";
import { EmptyState } from "./empty-state";
import { NotificationItem } from "./notification-item";

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
    (notification) =>
      notification.status === "unread" || notification.status === "read",
  );

  const archivedNotifications = notifications.filter(
    (notification) => notification.status === "archived",
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
                  {unreadNotifications.map((notification) => {
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
                  {archivedNotifications.map((notification) => {
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
