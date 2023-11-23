"use client";

import { Checkbox } from "@midday/ui/checkbox";
import { useOptimisticAction } from "next-safe-action/hook";

export function NotificationSetting({
  id,
  name,
  enabled,
  subscriberId,
  teamId,
  type,
  updateSubscriberPreferenceAction,
}) {
  const { execute, optimisticData } = useOptimisticAction(
    updateSubscriberPreferenceAction,
    { enabled },
    (state) => {
      return {
        ...state,
        enabled: !state.enabled,
      };
    }
  );

  const onChange = () => {
    execute({
      templateId: id,
      type,
      revalidatePath: "/settings/notifications",
      subscriberId,
      teamId,
      enabled: !enabled,
    });
  };

  return (
    <div className="flex items-center space-x-2 mb-3">
      <Checkbox
        id={id}
        checked={optimisticData.enabled}
        onCheckedChange={onChange}
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {name}
      </label>
    </div>
  );
}
