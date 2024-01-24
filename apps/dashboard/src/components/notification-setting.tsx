"use client";

import { useI18n } from "@/locales/client";
import { Checkbox } from "@midday/ui/checkbox";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { useOptimisticAction } from "next-safe-action/hooks";

export function NotificationSetting({
  id,
  name,
  enabled,
  subscriberId,
  teamId,
  type,
  updateSubscriberPreferenceAction,
}) {
  const t = useI18n();
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
    <div className="flex flex-row items-center justify-between border-b-[1px] pb-4 mb-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{name}</Label>
        <p className="text-sm text-[#606060]">
          {t(`notifications.${name.toLowerCase()}`)}
        </p>
      </div>
      <Switch
        id={id}
        checked={optimisticData.enabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
