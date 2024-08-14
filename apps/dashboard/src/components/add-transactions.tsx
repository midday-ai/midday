"use client";

import { useConnectParams } from "@/hooks/use-connect-params";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";

export function AddTransactions() {
  const { setParams } = useConnectParams();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Add />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={10} align="end">
        <DropdownMenuItem onClick={() => setParams({ step: "connect" })}>
          Connect
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setParams({ step: "import" })}>
          Import
        </DropdownMenuItem>
        {/* <DropdownMenuItem onClick={() => setParams({ step: "add" })}>
          Add
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
