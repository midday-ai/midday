"use client";

import { updateUserAction } from "@/actions/update-user-action";
import { useI18n } from "@/locales/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  timezone: string;
  timezones: { tzCode: string; name: string }[];
};

export function ChangeTimezone({ timezone, timezones }: Props) {
  const t = useI18n();

  const { execute, optimisticState } = useOptimisticAction(updateUserAction, {
    currentState: { timezone },
    updateFn: (state, newTimezone) => {
      return {
        timezone: newTimezone.timezone ?? state.timezone,
      };
    },
  });

  const timezoneItems = timezones.map((tz, id) => ({
    id: id.toString(),
    label: tz.name,
    value: tz.tzCode,
  }));

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>{t("timezone.title")}</CardTitle>
        <CardDescription>{t("timezone.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-[250px]">
          <ComboboxDropdown
            placeholder={t("timezone.placeholder")}
            selectedItem={timezoneItems.find(
              (item) => item.value === optimisticState.timezone,
            )}
            searchPlaceholder={t("timezone.searchPlaceholder")}
            items={timezoneItems}
            className="text-xs py-1"
            onSelect={(item) => {
              execute({ timezone: item.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
