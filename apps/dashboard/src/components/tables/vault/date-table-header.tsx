import { TableHead, TableHeader, TableRow } from "@midday/ui/table";

export function DataTableHeader() {
  return (
    <TableHeader className="border-0">
      <TableRow>
        <TableHead className="w-[45%]">Name</TableHead>
        <TableHead className="w-[20%]">Owner</TableHead>
        <TableHead className="w-[20%]">Tag</TableHead>
        <TableHead className="w-[15%]">Created at</TableHead>
      </TableRow>
    </TableHeader>
  );
}
