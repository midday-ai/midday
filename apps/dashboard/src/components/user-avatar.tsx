"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { AvatarUpload } from "./avatar-upload";

export function UserAvatar() {
  const t = useI18n();
  const { data: user } = useUserQuery();

  return (
    <Card>
      <div className="flex justify-between items-center pr-6">
        <CardHeader>
          <CardTitle>{t("settings.avatar.title")}</CardTitle>
          <CardDescription>
            {t("settings.avatar.description")}
          </CardDescription>
        </CardHeader>

        <AvatarUpload userId={user?.id!} avatarUrl={user?.avatarUrl} />
      </div>
      <CardFooter>{t("settings.avatar.footer")}</CardFooter>
    </Card>
  );
}
