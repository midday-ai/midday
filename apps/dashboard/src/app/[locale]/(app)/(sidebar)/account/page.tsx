import type { Metadata } from "next";
import { AccountSettings } from "@/components/account-settings";

export const metadata: Metadata = {
  title: "Account Settings | Midday",
};

export default async function Account() {
  return <AccountSettings />;
}
