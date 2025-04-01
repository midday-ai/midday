"use client";

import { useTRPC } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Switch } from "@midday/ui/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

export function WeekSettings() {
  const trpc = useTRPC();
  const updateUserMutation = useMutation(trpc.user.update.mutationOptions());

  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

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
          checked={user.week_starts_on_monday ?? false}
          disabled={updateUserMutation.isPending}
          onCheckedChange={(week_starts_on_monday: boolean) => {
            updateUserMutation.mutate({ week_starts_on_monday });
          }}
        />
      </CardContent>
    </Card>
  );
}
