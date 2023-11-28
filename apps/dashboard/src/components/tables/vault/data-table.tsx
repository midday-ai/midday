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
          <TableHead className="w-full">Uploaded</TableHead>
          <TableHead className="text-right w-full">Actions</TableHead>
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
