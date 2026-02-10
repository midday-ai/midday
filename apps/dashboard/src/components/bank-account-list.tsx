"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { AddAccountButton } from "./add-account-button";
import { BankConnections } from "./bank-connections";
import { ManualAccounts } from "./manual-accounts";

function EmptyState() {
  return (
    <div className="flex items-center justify-center border-b pb-24">
      <div className="flex flex-col items-center mt-24">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No bank accounts</h2>
          <p className="text-[#606060] text-sm">
            Connect your bank account to automatically <br />
            import transactions and track your finances.
          </p>
        </div>

        <AddAccountButton />
      </div>
    </div>
  );
}

export function BankAccountList() {
  const trpc = useTRPC();

  const { data: connections } = useSuspenseQuery(
    trpc.bankConnections.get.queryOptions(),
  );

  const { data: manualAccounts } = useSuspenseQuery(
    trpc.bankAccounts.get.queryOptions({
      manual: true,
    }),
  );

  const hasConnections = connections && connections.length > 0;
  const hasManualAccounts = manualAccounts && manualAccounts.length > 0;

  if (!hasConnections && !hasManualAccounts) {
    return <EmptyState />;
  }

  return (
    <>
      <BankConnections />
      <ManualAccounts />
      <div className="flex justify-end border-t pt-4 mt-6">
        <AddAccountButton />
      </div>
    </>
  );
}
