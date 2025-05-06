import { VaultHeader } from "@/components/vault/vault-header";
import { VaultSkeleton } from "@/components/vault/vault-skeleton";
import { VaultView } from "@/components/vault/vault-view";
import { loadDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadDocumentFilterParams(searchParams);

  prefetch(
    trpc.documents.get.infiniteQueryOptions({
      filter,
      pageSize: 20,
    }),
  );

  return (
    <div>
      <VaultHeader />

      <Suspense fallback={<VaultSkeleton />}>
        <VaultView />
      </Suspense>
    </div>
  );
}
