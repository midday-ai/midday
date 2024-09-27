import { MfaSettingsList } from "@/components/mfa-settings-list";
import { AddNewDeviceModal } from "@/components/modals/add-new-device";
import config from "@/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Security | ${config.company}`,
};

export default async function Security() {
  return (
    <div className="space-y-12">
      <MfaSettingsList />
      <AddNewDeviceModal />
    </div>
  );
}
