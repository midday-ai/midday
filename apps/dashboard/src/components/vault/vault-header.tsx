"use client";

import { VaultActions } from "@/components/vault/vault-actions";
import { VaultSearchFilter } from "@/components/vault/vault-search-filter";

export function VaultHeader() {
  return (
    <div className="flex justify-between py-6">
      <VaultSearchFilter />
      <VaultActions />
    </div>
  );
}
