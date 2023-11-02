import { Chart } from "@/components/charts/chart";
import { Period } from "@/components/charts/period";
import { Summary } from "@/components/charts/summary";
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

  return (
    <div>
      <Period className="mt-4 mb-8" />
      <Summary />
      <Chart />
    </div>
  );
}
