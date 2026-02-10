import { Suspense } from "react";
import { BankAccountList } from "@/components/bank-account-list";
import { BankAccountListSkeleton } from "./bank-account-list-skeleton";

export function ConnectedAccounts() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BankAccountListSkeleton />}>
        <BankAccountList />
      </Suspense>
    </div>
  );
}
