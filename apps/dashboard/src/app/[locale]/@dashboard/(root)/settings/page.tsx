import { ChangeAvatar } from "@/components/change-avatar";
import { DeleteAccount } from "@/components/delete-account";
import { DisplayName } from "@/components/display-name";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account | Midday",
};

export default function Account() {
  return (
    <div className="flex flex-col space-y-12">
      <ChangeAvatar />
      <DisplayName />
      <DeleteAccount />
    </div>
  );
}
