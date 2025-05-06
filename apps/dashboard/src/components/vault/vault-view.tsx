"use client";

import { DataTable } from "@/components/tables/vault/data-table";
import { useDocumentParams } from "@/hooks/use-document-params";
import { VaultGrid } from "./vault-grid";
import { VaultUploadZone } from "./vault-upload-zone";

export function VaultView() {
  const { params } = useDocumentParams();

  return (
    <VaultUploadZone>
      {params.view === "grid" ? <VaultGrid /> : <DataTable />}
    </VaultUploadZone>
  );
}
