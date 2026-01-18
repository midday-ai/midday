import { getI18n } from "@/locales/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "./error-fallback";
import {
  NotificationSettings,
  NotificationSettingsSkeleton,
} from "./notification-settings";

export async function NotificationsSettingsList() {
  const t = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications.title")}</CardTitle>
        <CardDescription>
          {t("settings.notifications.description")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<NotificationSettingsSkeleton />}>
            <NotificationSettings />
          </Suspense>
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}
