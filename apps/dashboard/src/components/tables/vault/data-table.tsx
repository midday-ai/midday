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
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60%]">Name</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((row) => (
          <DataTableRow key={row.name} data={row} />
        ))}
      </TableBody>
    </Table>
  );
}
