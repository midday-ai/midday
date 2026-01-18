import { AccountSettings } from "@/components/account-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings | Abacus",
};

export default async function Account() {
  return <AccountSettings />;
}
