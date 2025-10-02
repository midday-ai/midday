import { useTRPC } from "@/trpc/client";
import type {
  WidgetConfig,
  WidgetType,
} from "@midday/cache/widget-preferences-cache";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useWidgetActions, useWidgetConfig } from "./widget-provider";

export function useConfigurableWidget(widgetType: WidgetType) {
  const trpc = useTRPC();
  const config = useWidgetConfig(widgetType);
  const { setWidgetPreferences } = useWidgetActions();
  const [isConfiguring, setIsConfiguring] = useState(false);

  const updateConfigMutation = useMutation(
    trpc.widgets.updateWidgetConfig.mutationOptions({
      onSuccess: (preferences) => {
        setWidgetPreferences(preferences);
      },
    }),
  );

  const saveConfig = (newConfig: WidgetConfig) => {
    updateConfigMutation.mutate({
      widgetType,
      config: newConfig,
    });

    setIsConfiguring(false);
  };

  return {
    config,
    isConfiguring,
    setIsConfiguring,
    saveConfig,
    isUpdating: updateConfigMutation.isPending,
  };
}
