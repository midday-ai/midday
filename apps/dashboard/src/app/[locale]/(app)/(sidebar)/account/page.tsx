import { ChangeEmail } from "@/components/change-email";
import { ChangeTheme } from "@/components/change-theme";
import { DeleteAccount } from "@/components/delete-account";
import { DisplayName } from "@/components/display-name";
import { UserAvatar } from "@/components/user-avatar";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings | Midday",
};

export default async function Account() {
  const { data: userData } = await getUser();

  return (
    <div className="space-y-12">
      <UserAvatar
        userId={userData.id}
        fullName={userData.full_name}
        avatarUrl={userData?.avatar_url}
      />
      <DisplayName fullName={userData.full_name} />
      <ChangeEmail email={userData.email} />
      <ChangeTheme />
      <DeleteAccount />
    </div>
  );
}
