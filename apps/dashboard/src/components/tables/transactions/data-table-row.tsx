import { AssignedUser } from "@/components/assigned-user";
import { Category } from "@/components/category";
import { FormatAmount } from "@/components/format-amount";
import { TransactionMethod } from "@/components/transaction-method";
import { Icons } from "@midday/ui/icons";
import { TableCell, TableRow } from "@midday/ui/table";
import { cn } from "@midday/ui/utils";
import { format } from "date-fns";

export function DataTableCell({ children, className }) {
  return <TableCell className={className}>{children}</TableCell>;
}

export function Row({ onClick, children }) {
  return (
    <TableRow className="h-[45px]" onClick={onClick}>
      {children}
    </TableRow>
  );
}

export function DataTableRow({ row, setOpen }) {
  const fullfilled = row?.attachments?.length > 0;

  return (
    <Row key={row.id} onClick={() => setOpen(row.id)}>
      <DataTableCell>
        {row?.date && format(new Date(row.date), "MMM d")}
      </DataTableCell>
      <DataTableCell
        className={cn(
          "space-x-2",
          row.category === "income" && "text-[#00C969]"
        )}
      >
        {row.name}
      </DataTableCell>
      <DataTableCell>
        <span
          className={cn(
            "text-sm",
            row.category === "income" && "text-[#00C969]"
          )}
        >
          <FormatAmount amount={row.amount} currency={row.currency} />
        </span>
      </DataTableCell>
      <DataTableCell>
        <Category name={row.category} />
      </DataTableCell>
      <DataTableCell>
        <TransactionMethod method={row.method} />
      </DataTableCell>
      <DataTableCell>
        <AssignedUser user={row.assigned} />
      </DataTableCell>
      <DataTableCell>
        {fullfilled ? <Icons.Check /> : <Icons.AlertCircle />}
      </DataTableCell>
    </Row>
  );
}
