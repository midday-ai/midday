"use client";

import { updateUserAction } from "@/actions/update-user-action";
import { useI18n } from "@/locales/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@absplatform/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@absplatform/ui/select";
import { useAction } from "next-safe-action/hooks";

export function ChangeTimezone({
  value,
  timezones,
}: { value: string; timezones: any[] }) {
  const action = useAction(updateUserAction);
  const t = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("timezone.title")}</CardTitle>
        <CardDescription>{t("timezone.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={value}
          onValueChange={(value) => {
            action.execute({ timezone: value });
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t("timezone.placeholder")} />
          </SelectTrigger>
          <SelectContent className="max-w-[300px]">
            <SelectGroup>
              {timezones.map((timezone) => (
                <SelectItem value={timezone.tzCode} key={timezone.tzCode}>
                  <span className="line-clamp-1">{timezone.name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
