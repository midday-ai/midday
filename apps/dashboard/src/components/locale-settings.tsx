"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { countries } from "@midday/location/countries-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

export function LocaleSettings() {
  const t = useI18n();

  const trpc = useTRPC();
  const updateUserMutation = useMutation(trpc.user.update.mutationOptions());

  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

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
              (item) => item.value === user.locale,
            )}
            searchPlaceholder={t("locale.searchPlaceholder")}
            items={localeItems}
            className="text-xs py-1"
            onSelect={(item) => {
              updateUserMutation.mutate({ locale: item.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
