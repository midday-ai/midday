"use client";

import { assistantSettingsAction } from "@/actions/ai/assistant-settings-action";
import type { AI } from "@/actions/ai/chat";
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
import { useUIState } from "ai/rsc";
import { useAction, useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  enabled: boolean;
};

export function AssistantHistory({ enabled }: Props) {
  const { toast } = useToast();
  const [_, setMessages] = useUIState<typeof AI>();

  const { execute, status, optimisticState } = useOptimisticAction(
    assistantSettingsAction,
    {
      currentState: enabled,
      updateFn: (_, { enabled }) => Boolean(enabled),
    },
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
            checked={optimisticState}
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
            onClick={() => {
              clearHistory.execute(undefined);
              setMessages([]);
            }}
            disabled={clearHistory.status === "executing"}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
