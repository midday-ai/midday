"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import {
  getCategoryDisplayTitle,
  getNotificationDisplayInfoWithFallback,
} from "@/utils/notification-definitions";
import { NotificationSetting } from "./notification-setting";

export function NotificationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, categoryIndex) => (
        <div key={categoryIndex.toString()} className="border-b border-border">
          {/* Category header skeleton - closed accordion */}
          <div className="flex flex-1 items-center justify-between py-4">
            <Skeleton className="h-5 w-24" />
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </div>
      ))}
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

  // Group notifications by category
  const groupedNotifications = notificationTypes?.reduce(
    (acc, notificationType) => {
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
      if (filteredSettings.length === 0) return acc;

      const category = notificationType.category || "other";
      const order = notificationType.order || 999;

      if (!acc[category]) {
        acc[category] = {
          category,
          order,
          notifications: [],
        };
      }

      // Get display info from i18n translations
      const displayInfo = getNotificationDisplayInfoWithFallback(
        notificationType.type,
        t,
      );

      acc[category].notifications.push({
        type: notificationType.type,
        name: displayInfo.name,
        description: displayInfo.description,
        settings: filteredSettings,
      });

      return acc;
    },
    {} as Record<
      string,
      {
        category: string;
        order: number;
        notifications: Array<{
          type: string;
          name: string;
          description: string;
          settings: Array<{
            channel: "in_app" | "email" | "push";
            enabled: boolean;
          }>;
        }>;
      }
    >,
  );

  // Sort categories by order, then by name
  const sortedCategories = Object.values(groupedNotifications || {}).sort(
    (a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.category.localeCompare(b.category);
    },
  );

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        {sortedCategories.map((categoryGroup) => (
          <AccordionItem
            key={categoryGroup.category}
            value={categoryGroup.category}
          >
            <AccordionTrigger className="text-base">
              {getCategoryDisplayTitle(categoryGroup.category, t)}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {categoryGroup.notifications.map((notification) => (
                  <NotificationSetting
                    key={notification.type}
                    type={notification.type}
                    name={notification.name}
                    description={notification.description}
                    settings={notification.settings}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
