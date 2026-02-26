"use client";

import { ErrorFallback } from "@/components/error-fallback";
import { useNotifications } from "@/hooks/use-notifications";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "./empty-state";
import { NotificationItem } from "./notification-item";

const COLLECTION_TYPE_LABELS: Record<string, string> = {
  follow_up_due: "Follow-up Due",
  sla_breach: "SLA Breach",
  escalation: "Escalation",
  assignment: "Assignment",
};

export function NotificationCenter() {
  const [isOpen, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    hasUnseenNotifications,
    notifications,
    archived,
    markMessageAsRead,
    markAllMessagesAsSeen,
    markAllMessagesAsRead,
    isLoading,
  } = useNotifications();

  const unreadNotifications = notifications;
  const archivedNotifications = archived;

  // Collections notifications
  const { data: collectionsNotifications } = useQuery(
    trpc.collections.getNotifications.queryOptions(),
  );
  const { data: collectionsCount } = useQuery(
    trpc.collections.getNotificationCount.queryOptions(),
  );

  const markCollectionRead = useMutation(
    trpc.collections.markNotificationRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getNotifications.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getNotificationCount.queryKey(),
        });
      },
    }),
  );

  const markAllCollectionsRead = useMutation(
    trpc.collections.markAllNotificationsRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getNotifications.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getNotificationCount.queryKey(),
        });
      },
    }),
  );

  const hasCollectionsUnread = (collectionsCount ?? 0) > 0;
  const hasAnyUnread = hasUnseenNotifications || hasCollectionsUnread;

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
          {hasAnyUnread && (
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
                <TabsTrigger value="collections" className="font-normal relative">
                  Collections
                  {hasCollectionsUnread && (
                    <span className="ml-1 min-w-[16px] h-4 px-1 text-[10px] font-medium bg-[#FF3638] text-white rounded-full inline-flex items-center justify-center">
                      {collectionsCount}
                    </span>
                  )}
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

            <TabsContent value="collections" className="relative mt-0">
              {(!collectionsNotifications || collectionsNotifications.length === 0) && (
                <EmptyState description="No collections notifications" />
              )}

              {collectionsNotifications && collectionsNotifications.length > 0 && (
                <ScrollArea className="pb-12 h-[485px]">
                  <div className="divide-y">
                    {collectionsNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-3 py-3 hover:bg-secondary cursor-pointer"
                        onClick={() => {
                          if (n.caseId) {
                            router.push(`/collections/${n.caseId}`);
                            setOpen(false);
                          }
                        }}
                        onKeyDown={() => {}}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="h-9 w-9 flex items-center justify-center border rounded-full shrink-0">
                          <Icons.Collections size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {COLLECTION_TYPE_LABELS[n.type] ?? n.type}
                          </p>
                          <p className="text-xs text-[#606060] truncate">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-[#878787]">
                            {formatDistanceToNow(new Date(n.createdAt))} ago
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markCollectionRead.mutate({ id: n.id });
                          }}
                          className="p-1 text-[#878787] hover:text-primary shrink-0"
                          title="Mark as read"
                        >
                          <Icons.Check size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {collectionsNotifications && collectionsNotifications.length > 0 && (
                <div className="h-12 w-full absolute bottom-0 flex items-center justify-center border-t-[1px]">
                  <Button
                    variant="secondary"
                    className="bg-transparent"
                    onClick={() => markAllCollectionsRead.mutate()}
                  >
                    Mark all as read
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
