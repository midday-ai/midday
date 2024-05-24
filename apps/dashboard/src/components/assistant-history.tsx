"use client";

import { assistantSettingsAction } from "@/actions/ai/assistant-settings-action";
import { clearHistoryAction } from "@/actions/ai/clear-history-action";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Switch } from "@midday/ui/switch";
import { useToast } from "@midday/ui/use-toast";
import { useAction, useOptimisticAction } from "next-safe-action/hooks";

export function AssistantHistory({ enabled }) {
  const { toast } = useToast();

  const { execute, status, optimisticData } = useOptimisticAction(
    assistantSettingsAction,
    enabled,
    (_, { enabled }) => {
      return enabled;
    }
  );

  const clearHistory = useAction(clearHistoryAction, {
    onSuccess: () => {
      toast({
        duration: 4000,
        title: "History cleared successfully.",
        variant: "success",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>
          By default, we save your history for up to 30 days. You can disable
          and clear your history at any time.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex justify-between items-center border-border border-b-[1px] pb-6">
          <span className="font-medium text-sm">Enabled</span>
          <Switch
            checked={optimisticData}
            disabled={status === "executing"}
            onCheckedChange={(enabled: boolean) => {
              execute({ enabled });
            }}
          />
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium text-sm">Clear history</span>
          <Button
            variant="outline"
            onClick={() => clearHistory.execute(null)}
            disabled={clearHistory.status === "executing"}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
