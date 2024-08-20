"use client";

import { useVaultContext } from "@/store/vault/hook";
import { Button } from "@midday/ui/button";

export function Test() {
  const createFolder = useVaultContext((s) => s.createFolder);

  const handleCreateFolder = () => {
    createFolder({ name: "Untitled folder" });
  };

  return (
    <Button onClick={handleCreateFolder} variant="outline">
      Create folder
    </Button>
  );
}
