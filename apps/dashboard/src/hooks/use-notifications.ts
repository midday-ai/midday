"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export function useNotifications() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch notifications with priority 1-3 (notifications only)
  const {
    data: activitiesData,
    isLoading,
    error,
  } = useQuery(
    trpc.notifications.list.queryOptions({
      maxPriority: 3, // Only fetch notifications (priority <= 3)
      pageSize: 20,
    }),
  );

  // Mutations
  const updateStatusMutation = useMutation(
    trpc.notifications.updateStatus.mutationOptions({
      onSuccess: () => {
        // Invalidate and refetch notifications after successful update
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.list.queryKey(),
        });
      },
    }),
  );

  const updateAllStatusMutation = useMutation(
    trpc.notifications.updateAllStatus.mutationOptions({
      onSuccess: () => {
        // Invalidate and refetch notifications after successful update
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.list.queryKey(),
        });
      },
    }),
  );

  // Return notification activities directly without transformation
  const notifications = activitiesData?.data || [];

  // Mark a single message as read (archived)
  const markMessageAsRead = useCallback(
    (messageId: string) => {
      updateStatusMutation.mutate({
        activityId: messageId,
        status: "archived",
      });
    },
    [updateStatusMutation],
  );

  // Mark all messages as read (archived)
  const markAllMessagesAsRead = useCallback(() => {
    updateAllStatusMutation.mutate({
      status: "archived",
    });
  }, [updateAllStatusMutation]);

  // Mark all messages as seen (read)
  const markAllMessagesAsSeen = useCallback(() => {
    updateAllStatusMutation.mutate({
      status: "read",
    });
  }, [updateAllStatusMutation]);

  const hasUnseenNotifications = useMemo(
    () =>
      notifications.some(
        (notification: any) => notification.status === "unread",
      ),
    [notifications],
  );

  return {
    isLoading,
    error,
    notifications,
    hasUnseenNotifications,
    markMessageAsRead,
    markAllMessagesAsRead,
    markAllMessagesAsSeen,
  };
}
