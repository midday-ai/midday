"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Vault } from "./vault";

export function VaultWidget() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.vault.activity.queryOptions({ pageSize: 10 }),
  );

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060] -mt-12">No files found</p>
      </div>
    );
  }

  return <Vault files={data} />;
}
