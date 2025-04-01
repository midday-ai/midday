"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

type Props = {
  timezones: { tzCode: string; name: string }[];
};

export function ChangeTimezone({ timezones }: Props) {
  const t = useI18n();
  const trpc = useTRPC();

  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());
  const updateUserMutation = useMutation(trpc.user.update.mutationOptions());

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
              (item) => item.value === user.timezone,
            )}
            searchPlaceholder={t("timezone.searchPlaceholder")}
            items={timezoneItems}
            className="text-xs py-1"
            onSelect={(item) => {
              updateUserMutation.mutate({ timezone: item.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
