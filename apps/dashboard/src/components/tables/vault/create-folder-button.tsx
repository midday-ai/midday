"use client";

import { useVaultContext } from "@/store/vault/hook";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useCallback } from "react";

export function CreateFolderButton({ disableActions }) {
  const { createFolder, data } = useVaultContext((s) => ({
    createFolder: s.createFolder,
    data: s.data,
  }));

  const handleCreateFolder = useCallback(() => {
    if (data?.some((item) => item.name === "Untitled folder")) return;
    createFolder({ name: "Untitled folder" });
  }, [createFolder, data]);

  return (
    <Button
      variant="outline"
      className="w-[36px] h-[36px]"
      size="icon"
      disabled={disableActions}
      onClick={handleCreateFolder}
    >
      <Icons.CreateNewFolder />
    </Button>
  );
}
