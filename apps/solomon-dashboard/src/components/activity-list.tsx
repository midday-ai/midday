import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Suspense } from "react";
import { ActivityListDevices } from "./acrivity-list-devices";

export function ActivityList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account login activity</CardTitle>
        <CardDescription>
          You're currently logged in on these devices.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense>
          <ActivityListDevices />
        </Suspense>
      </CardContent>
    </Card>
  );
}
