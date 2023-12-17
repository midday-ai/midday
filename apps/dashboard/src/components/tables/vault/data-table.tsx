"use client";

import { useVaultContext } from "@/store/vault/hook";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { DataTableRow } from "./data-table-row";

export function DataTable({ teamId }) {
  const data = useVaultContext((s) => s.data);

  return (
    <Table>
      <TableHeader className="border-0">
        <TableRow>
          <TableHead className="w-[60%]">Name</TableHead>
          <TableHead className="w-[15%]">Created at</TableHead>
          <TableHead className="w-full">Last modified at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="border-r-0 border-l-0">
        {data?.map((row) => (
          <DataTableRow key={row.name} data={row} teamId={teamId} />
        ))}
      </TableBody>
    </Table>
  );
}
