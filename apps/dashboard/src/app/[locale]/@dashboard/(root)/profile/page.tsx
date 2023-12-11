import { ChangeLanguage } from "@/components/change-language";
import { ChangeTheme } from "@/components/change-theme";
import { DeleteAccount } from "@/components/delete-account";
import { DisplayName } from "@/components/display-name";
import { UserAvatar } from "@/components/user-avatar";
import { getUser } from "@midday/supabase/cached-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings | Midday",
};

export default async function Profile() {
  const { data: userData } = await getUser();

  return (
    <div className="space-y-12">
      <UserAvatar
        userId={userData.id}
        fullName={userData.full_name}
        avatarUrl={userData?.avatar_url}
      />
      <DisplayName fullName={userData.full_name} />
      <ChangeLanguage />
      <ChangeTheme />
      <DeleteAccount />
    </div>
  );
}
