import { getTeamBankAccounts } from "@midday/supabase/cached-queries";

export async function AccountsWidget() {
  const { data } = await getTeamBankAccounts();

  console.log(data);

  return <div className="px-6 pb-6 space-y-6 divide-y">Katt</div>;
}
