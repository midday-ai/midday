import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionsSettingsTabs } from "@/components/collections/settings/collections-settings-tabs";

export const metadata: Metadata = {
  title: "Collections Settings | Abacus",
};

export default function SettingsCollectionsPage() {
  return (
    <Suspense>
      <CollectionsSettingsTabs />
    </Suspense>
  );
}
