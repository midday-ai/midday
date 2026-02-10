"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { useNotifications } from "@/hooks/use-notifications";
import { EmptyState } from "./empty-state";
import { NotificationItem } from "./notification-item";

export function NotificationCenter() {
  const [isOpen, setOpen] = useState(false);

  const {
    hasUnseenNotifications,
    notifications,
    archived,
    markMessageAsRead,
    markAllMessagesAsSeen,
    markAllMessagesAsRead,
    isLoading,
  } = useNotifications();

  const unreadNotifications = notifications; // Main notifications (unread/read)
  const archivedNotifications = archived; // Archived notifications

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
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Tabs defaultValue="inbox">
            <TabsList className="w-full justify-between bg-transparent border-b-[1px] rounded-none py-6">
              <div className="flex">
                <TabsTrigger value="inbox" className="font-normal">
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="archive" className="font-normal">
                  Archive
                </TabsTrigger>
              </div>
              <Link
                href="/settings/notifications"
                onClick={() => setOpen(false)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="items-center justify-center transition-colors h-9 w-9 rounded-full bg-ransparent hover:bg-accent mr-2"
                >
                  <Icons.Settings size={16} />
                </Button>
              </Link>
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
        </ErrorBoundary>
      </PopoverContent>
    </Popover>
  );
}
