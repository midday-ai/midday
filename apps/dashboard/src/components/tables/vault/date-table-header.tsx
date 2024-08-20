import { TableHead, TableHeader, TableRow } from "@midday/ui/table";

export function DataTableHeader() {
  return (
    <TableHeader className="border-0">
      <TableRow>
        <TableHead className="w-[60%]">Name</TableHead>
        <TableHead className="w-full">Created at</TableHead>
      </TableRow>
    </TableHeader>
  );
}
