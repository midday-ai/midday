"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Switch } from "@midday/ui/switch";

export function AssistantCommandSettings() {
  //   if (!isDesktopApp()) {
  //     return null;
  //   }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spotlight</CardTitle>
        <CardDescription>
          By default, we save your history for up to 30 days. You can disable
          and clear your history at any time.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Enabled</span>
          <Switch
          //   checked={optimisticData}
          //   disabled={status === "executing"}
          //   onCheckedChange={(enabled: boolean) => {
          //     execute({ enabled });
          //   }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
