"use client";

import { Invites } from "./invites";
import { DataTable } from "./table";

export function TeamsTable() {
  return (
    <div className="flex flex-col gap-4">
      <DataTable />
      <Invites />
    </div>
  );
}
