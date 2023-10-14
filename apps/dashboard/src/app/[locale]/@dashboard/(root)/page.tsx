import { getTeamBankAccounts } from "@midday/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const accounts = await getTeamBankAccounts();

  if (!accounts.length) {
    redirect("/onboarding");
  }

  return <p>Overview</p>;
}
