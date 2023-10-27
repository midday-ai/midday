import { Chart } from "@/components/chart";
import { getTeamBankAccounts } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const supabase = await createClient();
  const { data } = await getTeamBankAccounts(supabase);

  if (!data?.length) {
    redirect("/onboarding");
  }

  return null;
  return <Chart />;
}
