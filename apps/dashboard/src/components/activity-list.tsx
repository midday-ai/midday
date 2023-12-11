import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
