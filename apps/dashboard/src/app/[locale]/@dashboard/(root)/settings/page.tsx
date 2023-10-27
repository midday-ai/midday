import { ChangeAvatar } from "@/components/change-avatar";
import { DeleteAccount } from "@/components/delete-account";
import { DisplayName } from "@/components/display-name";
import { getUserDetails } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account | Midday",
};

export default async function Account() {
  const supabase = createClient();
  const { data: userData } = await getUserDetails(supabase);

  return (
    <div className="flex flex-col space-y-12">
      <ChangeAvatar />
      <DisplayName defaultValue={userData.full_name} />
      <DeleteAccount />
    </div>
  );
}
