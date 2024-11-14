"use client";

import { updateUserAction } from "@/actions/update-user-action";
import { useI18n } from "@/locales/client";
import { countries } from "@midday/location/countries-intl";
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
  locale: string;
};

export function LocaleSettings({ locale }: Props) {
  const t = useI18n();

  const { execute, optimisticState } = useOptimisticAction(updateUserAction, {
    currentState: { locale },
    updateFn: (state, newLocale) => {
      return {
        locale: newLocale.locale ?? state.locale,
      };
    },
  });

  const localeItems = Object.values(countries).map((c, index) => ({
    id: index.toString(),
    label: `${c.name} (${c.default_locale})`,
    value: c.default_locale,
  }));

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>{t("locale.title")}</CardTitle>
        <CardDescription>{t("locale.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-[250px]">
          <ComboboxDropdown
            placeholder={t("locale.placeholder")}
            selectedItem={localeItems.find(
              (item) => item.value === optimisticState.locale,
            )}
            searchPlaceholder={t("locale.searchPlaceholder")}
            items={localeItems}
            className="text-xs py-1"
            onSelect={(item) => {
              execute({ locale: item.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
