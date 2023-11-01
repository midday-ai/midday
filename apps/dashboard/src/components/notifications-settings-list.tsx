import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";
import { NotificationSettings } from "./notification-settings";

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
        <Suspense fallback={<Skeleton className="h-4 w-[25%]" />}>
          <NotificationSettings />
        </Suspense>
      </CardContent>
    </Card>
  );
}
