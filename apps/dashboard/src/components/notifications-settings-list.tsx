import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Suspense } from "react";
import {
  NotificationSettings,
  NotificationSettingsSkeleton,
} from "./notification-settings";

export async function NotificationsSettingsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Manage your personal notification settings for this team.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<NotificationSettingsSkeleton />}>
          <NotificationSettings />
        </Suspense>
      </CardContent>
    </Card>
  );
}
