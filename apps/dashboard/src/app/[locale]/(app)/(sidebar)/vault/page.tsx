import { VaultHeader } from "@/components/vault/vault-header";
import { VaultView } from "@/components/vault/vault-view";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

export default function Page() {
  prefetch(
    trpc.documents.get.infiniteQueryOptions({
      pageSize: 20,
    }),
  );

  return (
    <div>
      <VaultHeader />

      <Suspense>
        <VaultView />
      </Suspense>
    </div>
  );
}
