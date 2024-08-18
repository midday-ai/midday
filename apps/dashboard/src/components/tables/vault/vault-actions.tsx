"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";

// const createFolder = useVaultContext((s) => s.createFolder);

// const handleCreateFolder = () => {
//   createFolder({ name: "Untitled folder" });
// };

export function VaultActions({ disableActions }: { disableActions: boolean }) {
  return (
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
        >
          <Icons.CreateNewFolder size={17} />
          <span>Create folder</span>
          <DropdownMenuShortcut>⇧⌘C</DropdownMenuShortcut>
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
  );
}
