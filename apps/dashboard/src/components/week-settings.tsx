"use client";

import { updateUserAction } from "@/actions/update-user-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Switch } from "@midday/ui/switch";
import { useAction } from "next-safe-action/hooks";

type Props = {
  weekStartsOnMonday: boolean;
};

export function WeekSettings({ weekStartsOnMonday }: Props) {
  const action = useAction(updateUserAction);

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
          checked={weekStartsOnMonday}
          disabled={action.status === "executing"}
          onCheckedChange={(week_starts_on_monday: boolean) => {
            action.execute({ week_starts_on_monday });
          }}
        />
      </CardContent>
    </Card>
  );
}
