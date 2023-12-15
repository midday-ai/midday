"use client";

import { useVaultContext } from "@/store/vault/hook";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function CreateFolderButton({ disableActions }) {
  const createFolder = useVaultContext((s) => s.createFolder);

  const handleCreateFolder = () => {
    createFolder({ name: "Untitled folder" });
  };

  return (
    <Button
      variant="outline"
      className="w-[32px] h-[32px]"
      size="icon"
      disabled={disableActions}
      onClick={handleCreateFolder}
    >
      <Icons.CreateNewFolder />
    </Button>
  );
}
