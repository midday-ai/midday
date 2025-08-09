"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { getNotificationDisplayInfoWithFallback } from "@/utils/notification-definitions";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { NotificationSetting } from "./notification-setting";

export function NotificationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, index) => (
        <NotificationSettingSkeleton key={index.toString()} />
      ))}
    </div>
  );
}

function NotificationSettingSkeleton() {
  return (
    <div className="border-b-[1px] pb-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-8 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
    </div>
  );
}

export function NotificationSettings() {
  const t = useI18n();
  const trpc = useTRPC();

  const { data: notificationTypes, isLoading } = useQuery(
    trpc.notificationSettings.getAll.queryOptions(),
  );

  if (isLoading) {
    return <NotificationSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Individual Notification Settings */}
      <div className="space-y-4">
        {notificationTypes?.map((notificationType) => {
          // Include all channel settings (in_app, email, push)
          const filteredSettings = notificationType.settings.filter(
            (
              setting,
            ): setting is {
              channel: "in_app" | "email" | "push";
              enabled: boolean;
            } =>
              setting.channel === "in_app" ||
              setting.channel === "email" ||
              setting.channel === "push",
          );

          // Skip if no settings remain after filtering
          if (filteredSettings.length === 0) return null;

          // Get display info from i18n translations
          const displayInfo = getNotificationDisplayInfoWithFallback(
            notificationType.type,
            t,
          );

          return (
            <NotificationSetting
              key={notificationType.type}
              type={notificationType.type}
              name={displayInfo.name}
              description={displayInfo.description}
              settings={filteredSettings}
            />
          );
        })}
      </div>
    </div>
  );
}
