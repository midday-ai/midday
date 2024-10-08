"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function AddTransactions() {
  const [_, setParams] = useQueryStates({
    step: parseAsString,
    hide: parseAsBoolean,
    "create-transaction": parseAsBoolean,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Add size={17} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={10} align="end">
        <DropdownMenuItem
          onClick={() => setParams({ step: "connect" })}
          className="space-x-2"
        >
          <Icons.Accounts size={18} />
          <span>Connect account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setParams({ step: "import", hide: true })}
          className="space-x-2"
        >
          <Icons.Import size={18} />
          <span>Import/backfill</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setParams({ "create-transaction": true })}
          className="space-x-2"
        >
          <Icons.CreateTransaction size={18} />
          <span>Create transaction</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
