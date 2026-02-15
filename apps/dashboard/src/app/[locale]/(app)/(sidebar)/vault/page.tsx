import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { VaultHeader } from "@/components/vault/vault-header";
import { VaultSkeleton } from "@/components/vault/vault-skeleton";
import { VaultView } from "@/components/vault/vault-view";
import { loadDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { prefetch, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";

export const metadata: Metadata = {
  title: "Vault | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadDocumentFilterParams(searchParams);

  const initialSettings = await getInitialTableSettings("vault");

  prefetch(
    trpc.documents.get.infiniteQueryOptions({
      ...filter,
      pageSize: 24,
    }),
  );

  return (
    <ScrollableContent>
      <VaultHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<VaultSkeleton />}>
          <VaultView initialSettings={initialSettings} />
        </Suspense>
      </ErrorBoundary>
    </ScrollableContent>
  );
}
