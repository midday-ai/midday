"use client";

import { DataTable } from "@/components/tables/vault/data-table";
import { useDocumentParams } from "@/hooks/use-document-params";
import type { TableSettings } from "@/utils/table-settings";
import { VaultGrid } from "./vault-grid";
import { VaultUploadZone } from "./vault-upload-zone";

type Props = {
  initialSettings?: Partial<TableSettings>;
};

export function VaultView({ initialSettings }: Props) {
  const { params } = useDocumentParams();

  return (
    <VaultUploadZone>
      {params.view === "grid" ? (
        <VaultGrid />
      ) : (
        <DataTable initialSettings={initialSettings} />
      )}
    </VaultUploadZone>
  );
}
