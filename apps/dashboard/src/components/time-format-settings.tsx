"use client";

import { useUserMutation, useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";

export function TimeFormatSettings() {
  const t = useI18n();
  const updateUserMutation = useUserMutation();
  const { data: user } = useUserQuery();

  return (
    <Card className="flex flex-col md:flex-row md:justify-between md:items-center">
      <CardHeader>
        <CardTitle>{t("settings.time_format.title")}</CardTitle>
        <CardDescription id="time-format-description">
          {t("settings.time_format.description")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={user?.timeFormat?.toString() ?? undefined}
          onValueChange={(value) => {
            updateUserMutation.mutate({ timeFormat: +value });
          }}
        >
          <SelectTrigger
            className="w-[180px]"
            aria-label={t("settings.time_format.title")}
            aria-describedby="time-format-description"
          >
            <SelectValue placeholder={t("settings.time_format.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">{t("settings.time_format.hour_12")}</SelectItem>
            <SelectItem value="24">{t("settings.time_format.hour_24")}</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
