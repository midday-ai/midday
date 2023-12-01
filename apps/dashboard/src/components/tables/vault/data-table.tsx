"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useOptimistic } from "react";
import { DataTableRow } from "./data-table-row";

export function DataTable({ data }) {
  const [optimisticData, addOptimisticData] = useOptimistic(
    data,
    (state, item) => [...state, item]
  );

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
        {optimisticData?.map((row) => (
          <DataTableRow
            key={row.name}
            data={row}
            addOptimisticData={addOptimisticData}
          />
        ))}
      </TableBody>
    </Table>
  );
}
