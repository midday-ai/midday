import { TableHead, TableHeader, TableRow } from "@midday/ui/table";

export function OrdersTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[120px]">Date</TableHead>
        <TableHead className="w-[100px]">Amount</TableHead>
        <TableHead className="w-[120px]">Status</TableHead>
        <TableHead className="w-[140px]">Product</TableHead>
        <TableHead className="w-[100px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
