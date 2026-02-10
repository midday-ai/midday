"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Switch } from "@midday/ui/switch";
import { useUserMutation, useUserQuery } from "@/hooks/use-user";

export function WeekSettings() {
  const { data: user } = useUserQuery();
  const updateUserMutation = useUserMutation();

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>Start Week on Monday</CardTitle>
        <CardDescription>
          Set the first day of the week in calendar views.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Switch
          checked={user?.weekStartsOnMonday ?? false}
          disabled={updateUserMutation.isPending}
          onCheckedChange={(weekStartsOnMonday: boolean) => {
            updateUserMutation.mutate({ weekStartsOnMonday });
          }}
        />
      </CardContent>
    </Card>
  );
}
