"use client";

import { updateUserAction } from "@/actions/update-user-action";
import { countries } from "@midday/location/countries-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useAction } from "next-safe-action/hooks";

type Props = {
  locale: string;
};

export function LocaleSettings({ locale }: Props) {
  const action = useAction(updateUserAction);

  const localeItems = Object.values(countries).map((c, index) => ({
    id: index.toString(),
    label: `${c.name} (${c.default_locale})`,
    value: c.default_locale,
  }));

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>Locale & Formatting</CardTitle>
        <CardDescription>
          This will change how currency and other locale-specific data is
          formatted throughout the app.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-[250px]">
          <ComboboxDropdown
            placeholder="Select locale"
            selectedItem={localeItems.find((item) => item.value === locale)}
            searchPlaceholder="Search locales"
            items={localeItems}
            className="text-xs py-1"
            onSelect={(item) => {
              action.execute({ locale: item.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
