import { NumberFormat } from "@/components/number-format";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { cn } from "@midday/ui/utils";
import { format } from "date-fns";
import { DataTableHeader } from "./data-table-header";

function AssignedUser({ user }) {
  return (
    <div className="flex space-x-2 w-[120px]">
      <Avatar className="h-5 w-5">
        <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
      </Avatar>
      <span className="truncate">{user?.full_name.split(" ").at(0)}</span>
    </div>
  );
}

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
};

export function DataTableRow({ data }) {
  const fullfilled = data.attachment && data.vat;

  return (
    <TableRow className="h-[45px]">
      <TableCell className="w-[380px]">
        <span className={cn(data.amount > 0 && "text-[#00E547]")}>
          {data.name}
        </span>
      </TableCell>
      <TableCell className="w-[170px]">
        {data.date && format(new Date(data.date), "E, LLL d, y")}
      </TableCell>
      <TableCell className="w-[250px]">
        <NumberFormat
          amount={data.amount}
          currency={data.currency}
          className={data.amount > 0 && "text-[#00E547]"}
        />
      </TableCell>
      <TableCell className="w-[280px]">{data.method}</TableCell>
      <TableCell className="w-[180px]">
        <AssignedUser user={data.assigned} />
      </TableCell>
      <TableCell>
        {fullfilled ? <Icons.Check /> : <Icons.AlertCircle />}
      </TableCell>
    </TableRow>
  );
}

export function DataTable({ data }: ItemsProps) {
  return (
    <Table>
      <DataTableHeader />
      <TableBody>
        {data?.map((row) => (
          <DataTableRow key={row.id} data={row} />
        ))}
      </TableBody>
    </Table>
  );
}
