import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { DataTableRow } from "./data-table-row";

export function DataTable({ data }) {
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
          <DataTableRow key={row.name} data={row} />
        ))}
      </TableBody>
    </Table>
  );
}
