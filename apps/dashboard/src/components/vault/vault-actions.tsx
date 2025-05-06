"use client";

import { VaultViewSwitch } from "@/components/vault/vault-view-switch";
import { VaultUploadButton } from "./vault-upload-button";

export function VaultActions() {
  return (
    <div className="space-x-2 hidden md:flex">
      <VaultViewSwitch />
      <VaultUploadButton />
    </div>
  );
}
