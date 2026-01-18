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

export function DateFormatSettings() {
  const t = useI18n();
  const { data: user } = useUserQuery();
  const updateUserMutation = useUserMutation();

  return (
    <Card className="flex flex-col md:flex-row md:justify-between md:items-center">
      <CardHeader>
        <CardTitle>{t("settings.date_format.title")}</CardTitle>
        <CardDescription id="date-format-description">
          {t("settings.date_format.description")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={user?.dateFormat ?? undefined}
          onValueChange={(value) => {
            updateUserMutation.mutate({
              dateFormat: value as
                | "dd/MM/yyyy"
                | "MM/dd/yyyy"
                | "yyyy-MM-dd"
                | "dd.MM.yyyy",
            });
          }}
        >
          <SelectTrigger
            className="w-[180px]"
            aria-label={t("settings.date_format.title")}
            aria-describedby="date-format-description"
          >
            <SelectValue placeholder={t("settings.date_format.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
            <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
            <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
            <SelectItem value="dd.MM.yyyy">dd.MM.yyyy</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
