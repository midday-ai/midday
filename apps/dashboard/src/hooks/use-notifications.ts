"use client";

import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export function useNotifications() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();

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

  // Real-time subscription for activities filtered by user_id
  useRealtime({
    channelName: "user-notifications",
    event: "INSERT",
    table: "activities",
    filter: `user_id=eq.${user?.id}`,
    onEvent: () => {
      // Invalidate and refetch notifications when activities change
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.list.queryKey(),
      });
    },
  });

  // Mutations
  const updateStatusMutation = useMutation(
    trpc.notifications.updateStatus.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({
          queryKey: trpc.notifications.list.queryKey(),
        });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(
          trpc.notifications.list.queryKey({
            maxPriority: 3,
            pageSize: 20,
          }),
        );

        // Optimistically update the cache
        queryClient.setQueryData(
          trpc.notifications.list.queryKey({
            maxPriority: 3,
            pageSize: 20,
          }),
          (old) => {
            if (!old?.data) return old;

            return {
              ...old,
              data: old.data.map((notification) =>
                notification.id === variables.activityId
                  ? { ...notification, status: variables.status }
                  : notification,
              ),
            };
          },
        );

        // Return a context object with the snapshotted value
        return { previousData };
      },
      onError: (_, __, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.notifications.list.queryKey({
              maxPriority: 3,
              pageSize: 20,
            }),
            context.previousData,
          );
        }
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have the latest data
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.list.queryKey(),
        });
      },
    }),
  );

  const updateAllStatusMutation = useMutation(
    trpc.notifications.updateAllStatus.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({
          queryKey: trpc.notifications.list.queryKey(),
        });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(
          trpc.notifications.list.queryKey({
            maxPriority: 3,
            pageSize: 20,
          }),
        );

        // Optimistically update the cache - update all notifications to the new status
        queryClient.setQueryData(
          trpc.notifications.list.queryKey({
            maxPriority: 3,
            pageSize: 20,
          }),
          (old) => {
            if (!old?.data) return old;

            return {
              ...old,
              data: old.data.map((notification) => ({
                ...notification,
                status: variables.status,
              })),
            };
          },
        );

        // Return a context object with the snapshotted value
        return { previousData };
      },
      onError: (_, __, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.notifications.list.queryKey({
              maxPriority: 3,
              pageSize: 20,
            }),
            context.previousData,
          );
        }
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have the latest data
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
      notifications.some((notification) => notification.status === "unread"),
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
