// @ts-nocheck - will be removed soon

import { HeadlessService } from "@novu/headless";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUserQuery } from "@/hooks/use-user";

export function useNotifications() {
  const [isLoading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const headlessServiceRef = useRef<HeadlessService>();
  const { data: user } = useUserQuery();

  const markAllMessagesAsRead = () => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      setNotifications((prevNotifications: typeof notifications) =>
        prevNotifications.map(
          (notification: (typeof notifications)[number]) => ({
            ...notification,
            read: true,
          }),
        ),
      );

      headlessService.markAllMessagesAsRead({
        listener: () => {},
        onError: () => {},
      });
    }
  };

  const markMessageAsRead = (messageId: string) => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => {
          if (notification.id === messageId) {
            return {
              ...notification,
              read: true,
            };
          }

          return notification;
        }),
      );

      headlessService.markNotificationsAsRead({
        messageId: [messageId],
        listener: (_result) => {},
        onError: (_error) => {},
      });
    }
  };

  const fetchNotifications = useCallback(() => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      headlessService.fetchNotifications({
        listener: () => {},
        onSuccess: (response) => {
          setLoading(false);
          setNotifications(response.data);
        },
      });
    }
  }, []);

  const markAllMessagesAsSeen = () => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          seen: true,
        })),
      );
      headlessService.markAllMessagesAsSeen({
        listener: () => {},
        onError: () => {},
      });
    }
  };

  useEffect(() => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      headlessService.listenNotificationReceive({
        listener: () => {
          fetchNotifications();
        },
      });
    }
  }, [headlessServiceRef.current]);

  useEffect(() => {
    const subscriberId = `${user?.teamId}_${user?.id}`;

    if (subscriberId && !headlessServiceRef.current) {
      const headlessService = new HeadlessService({
        applicationIdentifier:
          process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER!,
        subscriberId,
      });

      headlessService.initializeSession({
        listener: () => {},
        onSuccess: () => {
          headlessServiceRef.current = headlessService;
          fetchNotifications();
        },
        onError: () => {},
      });
    }
  }, [fetchNotifications, user]);

  return {
    isLoading,
    markAllMessagesAsRead,
    markMessageAsRead,
    markAllMessagesAsSeen,
    hasUnseenNotifications: notifications.some(
      (notification) => !notification.seen,
    ),
    notifications,
  };
}
