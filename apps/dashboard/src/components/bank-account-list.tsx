import { BankAccount } from "@/components/bank-account";
import { getTeamBankAccounts } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Skeleton } from "@midday/ui/skeleton";

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
      <div className="flex justify-between pt-6 items-center">
        <div className="flex items-center">
          <Skeleton className="flex h-9 w-9 items-center justify-center space-y-0 rounded-full" />
          <div className="ml-4 flex flex-col">
            <p className="text-sm font-medium leading-none mb-1">
              <Skeleton className="h-4 w-[200px]" />
            </p>
            <span className="text-xs font-medium text-[#606060]">
              <Skeleton className="h-2.5 w-[100px] mt-1" />
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
  const supabase = createClient();
  const { data } = await getTeamBankAccounts(supabase);

  return (
    <div className="px-6 pb-6 space-y-6 divide-y">
      {data.map((account) => (
        <BankAccount
          key={account.id}
          id={account.id}
          last_accessed={account.last_accessed}
          bank_name={account.bank.name}
          name={account.name}
          logo={account.bank.logo_url}
        />
      ))}
    </div>
  );
}
