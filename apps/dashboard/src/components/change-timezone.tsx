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
import { useAction } from "next-safe-action/hooks";

type Timezone = {
  tzCode: string;
  name: string;
};

export function ChangeTimezone({
  timezone,
  timezones,
}: { timezone: string; timezones: Timezone[] }) {
  const action = useAction(updateUserAction);
  const t = useI18n();

  const timezoneItems = timezones.map((tz) => ({
    id: tz.tzCode,
    label: tz.name,
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
            selectedItem={timezoneItems.find((item) => item.id === timezone)}
            searchPlaceholder={t("timezone.searchPlaceholder")}
            items={timezoneItems}
            className="text-xs py-1"
            onSelect={(item) => {
              action.execute({ timezone: item.id });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
