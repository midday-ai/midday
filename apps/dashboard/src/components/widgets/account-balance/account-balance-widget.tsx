import { getTeamBankAccounts } from "@midday/supabase/cached-queries";
import { AccountBalance } from "./account-balance";

export function AccountBalanceSkeleton() {
  return null;
}

export async function AccountBalanceWidget() {
  const { data: accountsData } = await getTeamBankAccounts({ enabled: true });

  return (
    <div>
      <div className="flex justify-between">
        <div>
          <h2 className="text-lg">Account balance</h2>
        </div>
      </div>

      <AccountBalance data={accountsData} />
    </div>
  );
}
