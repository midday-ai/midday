"use client";

import { AddAccountButton } from "@/components/add-account-button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export function EmptyState() {
  const trpc = useTRPC();

  const { data: accounts } = useQuery(
    trpc.bankAccounts.get.queryOptions({
      enabled: true,
    }),
  );

  const isEmpty = !accounts?.length;

  if (!isEmpty) {
    return null;
  }

  return (
    <div className="absolute w-full h-full top-0 left-0 flex items-center justify-center z-20">
      <div className="text-center max-w-md mx-auto flex flex-col items-center justify-center">
        <h2 className="text-xl font-medium mb-2">Connect bank account</h2>
        <p className="text-sm text-[#878787] mb-6">
          Connect your bank account to unlock powerful financial insights. Track
          your spending, analyze trends, and make informed decisions.
        </p>

        <AddAccountButton />
      </div>
    </div>
  );
}
