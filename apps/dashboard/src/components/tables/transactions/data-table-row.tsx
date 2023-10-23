"use client";

import { NumberFormat } from "@/components/number-format";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

function AssignedUser({ user }) {
  return (
    <div className="flex space-x-2 w-[120px] px-4 py-2">
      <Avatar className="h-5 w-5">
        <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
      </Avatar>
      <span className="truncate">{user?.full_name.split(" ").at(0)}</span>
    </div>
  );
}

export function DataTableCell({ children, className }) {
  return (
    <div
      className={cn(
        className,
        "h-[45px] px-4 py-2 border-r last:border-none truncate overflow-hidden text-sm flex items-center",
      )}
    >
      {children}
    </div>
  );
}

export function Row({ children, onSelect }) {
  return (
    <div
      className="flex border-b items-center h-[45px] hover:bg-secondary"
      onClick={onSelect}
    >
      {children}
    </div>
  );
}

export function DataTableRow({ collapsed, onSelect, data }) {
  const fullfilled = data.attachment && data.vat;

  return (
    <Row onSelect={onSelect}>
      <DataTableCell className="w-[100px]">
        {data.date && format(new Date(data.date), "MMM d")}
      </DataTableCell>

      <DataTableCell className="w-[430px]">{data.name}</DataTableCell>

      <DataTableCell className="w-[200px]">
        <NumberFormat
          amount={data.amount}
          currency={data.currency}
          className={data.amount > 0 && "text-[#00E547]"}
        />
      </DataTableCell>

      <motion.div
        className="border-r"
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "20%" }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
      >
        <DataTableCell>{data.method}</DataTableCell>
      </motion.div>

      <motion.div
        className="border-r"
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "20%" }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
      >
        <DataTableCell>
          <AssignedUser user={data.user} />
        </DataTableCell>
      </motion.div>

      <DataTableCell className="w-[100px]">
        {fullfilled ? <Icons.Check /> : <Icons.AlertCircle />}
      </DataTableCell>
    </Row>
  );
}
