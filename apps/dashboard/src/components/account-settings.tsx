"use client";

import { ChangeEmail } from "@/components/change-email";
import { ChangeTheme } from "@/components/change-theme";
import { DeleteAccount } from "@/components/delete-account";
import { DisplayName } from "@/components/display-name";
import { UserAvatar } from "@/components/user-avatar";

export function AccountSettings() {
  return (
    <div className="space-y-12">
      <UserAvatar />
      <DisplayName />
      <ChangeEmail />
      <ChangeTheme />
      <DeleteAccount />
    </div>
  );
}
