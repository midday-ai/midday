"use client";

import { updateUserAction } from "@/actions/update-user-action";
import {
  languages,
  useChangeLocale,
  useCurrentLocale,
  useI18n,
} from "@/locales/client";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useAction } from "next-safe-action/hooks";

export function ChangeLanguage() {
  const action = useAction(updateUserAction);
  const changeLocale = useChangeLocale();
  const locale = useCurrentLocale();
  const t = useI18n();

  const handleOnChange = async (locale: string) => {
    await action.execute({ locale });
    changeLocale(locale);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("language.title")}</CardTitle>
        <CardDescription>{t("language.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Select defaultValue={locale} onValueChange={handleOnChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("language.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {languages.map((language) => (
                <SelectItem value={language} key={language}>
                  {t(`languages.${language}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
