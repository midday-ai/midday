import { MfaSettingsList } from "@/components/mfa-settings-list";
import { AddNewDeviceModal } from "@/components/modals/add-new-device";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | Midday",
};

export default async function Security() {
  return (
    <div className="space-y-12">
      <MfaSettingsList />
      <AddNewDeviceModal />
    </div>
  );
}
