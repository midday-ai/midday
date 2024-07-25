import { getTeamBankAccounts } from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { BankConnections } from "./bank-connections";

export function BankAccountListSkeleton() {
  return (
    <div className="px-6 pb-6 space-y-6 divide-y">
      <div className="flex justify-between pt-6 items-center">
        <div className="flex items-center">
          <Skeleton className="flex h-9 w-9 items-center justify-center space-y-0 rounded-full" />
          <div className="ml-4 flex flex-col">
            <p className="text-sm font-medium leading-none mb-1">
              <Skeleton className="h-3 w-[200px]" />
            </p>
            <span className="text-xs font-medium text-[#606060]">
              <Skeleton className="h-2.5 w-[100px] mt-2" />
            </span>
            <span className="text-xs text-[#606060]">
              <Skeleton className="h-2.5 w-[160px] mt-1" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function BankAccountList() {
  const { data } = await getTeamBankAccounts();

  const bankMap = {};

  for (const item of data) {
    const bankId = item.bank.id;

    if (!bankMap[bankId]) {
      // If the bank is not in the map, add it
      bankMap[bankId] = {
        ...item.bank,
        accounts: [],
      };
    }

    // Add the account to the bank's accounts array
    bankMap[bankId].accounts.push(item);
  }

  // Convert the map to an array
  const result = Object.values(bankMap);

  function sortAccountsByEnabled(accounts) {
    return accounts.sort((a, b) => b.enabled - a.enabled);
  }

  // Sort the accounts within each bank in the result array
  for (const bank of result) {
    if (Array.isArray(bank.accounts)) {
      bank.accounts = sortAccountsByEnabled(bank.accounts);
    }
  }

  return <BankConnections data={result} />;
}
