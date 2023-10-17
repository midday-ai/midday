import { getTeamBankAccounts } from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const supabase = await getSupabaseServerClient();
  const { data } = await getTeamBankAccounts(supabase);

  if (!data?.length) {
    redirect("/onboarding");
  }

  return <p>Overview</p>;
}
