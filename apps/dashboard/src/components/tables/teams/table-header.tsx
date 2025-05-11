"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import type { Table } from "@tanstack/react-table";
import Link from "next/link";

type Props = {
  table?: Table<RouterOutputs["team"]["list"][number]>;
};

export function DataTableHeader({ table }: Props) {
  return (
    <div className="flex items-center pb-4 space-x-4">
      <Input
        className="flex-1"
        placeholder="Search..."
        value={(table?.getColumn("team")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("team")?.setFilterValue(event.target.value)
        }
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      <Link href="/teams/create">
        <Button>Create team</Button>
      </Link>
    </div>
  );
}
