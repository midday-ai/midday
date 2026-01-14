import { AddAccountButton } from "@/components/add-account-button";
import { BankAccountList } from "@/components/bank-account-list";
import { Suspense } from "react";
import { BankAccountListSkeleton } from "./bank-account-list-skeleton";

export function ConnectedAccounts() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BankAccountListSkeleton />}>
        <BankAccountList />
      </Suspense>

      <div className="flex justify-end">
        <AddAccountButton />
      </div>
    </div>
  );
}
