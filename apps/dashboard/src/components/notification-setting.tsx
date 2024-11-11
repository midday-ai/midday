"use client";

import { updateSubscriberPreferenceAction } from "@/actions/update-subscriber-preference-action";
import { useI18n } from "@/locales/client";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  id: string;
  name: string;
  enabled: boolean;
  subscriberId: string;
  teamId: string;
  type: string;
};

export function NotificationSetting({
  id,
  name,
  enabled,
  subscriberId,
  teamId,
  type,
}: Props) {
  const t = useI18n();
  const { execute, optimisticState } = useOptimisticAction(
    updateSubscriberPreferenceAction,
    {
      currentState: { enabled },
      updateFn: (state) => {
        return {
          ...state,
          enabled: !state.enabled,
        };
      },
    },
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
          {/* Replace all spaces with a dot to match the translation key */}
          {t(`notifications.${name.toLowerCase().replaceAll(" ", ".")}`)}
        </p>
      </div>
      <Switch
        id={id}
        checked={optimisticState.enabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
