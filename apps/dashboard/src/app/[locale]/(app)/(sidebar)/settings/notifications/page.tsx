import { NotificationsSettingsList } from "@/components/notifications-settings-list";
import config from "@/config";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: `Notifications | ${config.company}`,
};

export default async function Notifications() {
  return (
    <Suspense>
      <NotificationsSettingsList />
    </Suspense>
  );
}
