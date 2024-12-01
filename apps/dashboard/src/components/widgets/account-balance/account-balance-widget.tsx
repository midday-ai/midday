import { getBankAccountsBalances } from "@midday/supabase/cached-queries";
import { AccountBalance } from "./account-balance";

export function AccountBalanceSkeleton() {
  return null;
}

export async function AccountBalanceWidget() {
  const accountsData = await getBankAccountsBalances();

  return (
    <div className="h-full">
      <div className="flex justify-between">
        <div>
          <h2 className="text-lg">Account balance</h2>
        </div>
      </div>

      <AccountBalance data={accountsData?.data} />
    </div>
  );
}
