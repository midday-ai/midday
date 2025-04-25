import { VaultGrid } from "./vault-grid";
import { VaultUploadZone } from "./vault-upload-zone";

export function VaultView() {
  return (
    <VaultUploadZone>
      <VaultGrid />
    </VaultUploadZone>
  );
}
