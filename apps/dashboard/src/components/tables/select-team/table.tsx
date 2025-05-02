"use client";

import type { RouterOutputs } from "@/trpc/routers/_app";
import { Table, TableBody } from "@midday/ui/table";
import { TableRow } from "./table-row";

type Props = {
  data: RouterOutputs["team"]["list"];
};

export function SelectTeamTable({ data }: Props) {
  return (
    <Table>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
