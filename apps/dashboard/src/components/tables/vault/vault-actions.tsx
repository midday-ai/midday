"use client";

import { useVaultContext } from "@/store/vault/hook";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useHotkeys } from "react-hotkeys-hook";

export function VaultActions({ disableActions }: { disableActions: boolean }) {
  const createFolder = useVaultContext((s) => s.createFolder);

  const handleCreateFolder = () => {
    createFolder({ name: "Untitled folder" });
  };

  useHotkeys("shift+meta+u", (evt) => {
    evt.preventDefault();
    document.getElementById("upload-files")?.click();
  });

  useHotkeys("shift+meta+f", (evt) => {
    evt.preventDefault();
    handleCreateFolder();
  });

  return (
    <div className="absolute -top-[55px] right-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Icons.Add size={17} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]" sideOffset={10}>
          <DropdownMenuItem
            className="flex items-center gap-2"
            disabled={disableActions}
            onClick={handleCreateFolder}
          >
            <Icons.CreateNewFolder size={17} />
            <span>Create folder</span>
            <DropdownMenuShortcut>⇧⌘F</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2"
            disabled={disableActions}
            onClick={() => document.getElementById("upload-files")?.click()}
          >
            <Icons.FileUpload size={17} />
            <span>Upload files</span>
            <DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
