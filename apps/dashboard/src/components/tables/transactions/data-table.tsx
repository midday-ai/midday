"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { cn } from "@midday/ui/utils";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";

function FormattedAmount({ currency, amount }) {
  if (!currency || !amount) {
    return null;
  }

  const formattedAmount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);

  return (
    <span className={cn(amount > 0 && "text-[#00E547]")}>
      {formattedAmount}
    </span>
  );
}

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
  fetchMore: (page?: number) => Promise<Item[]>;
};

export function DataTableRow({ data }) {
  const fullfilled = data.attachment && data.vat;

  return (
    <TableRow>
      <TableCell className="w-[380px]">
        <span className={cn(data.amount > 0 && "text-[#00E547]")}>
          {data.name}
        </span>
      </TableCell>
      <TableCell className="w-[170px]">
        {data.date && format(new Date(data.date), "E, LLL d, y")}
      </TableCell>
      <TableCell className="w-[250px]">
        <FormattedAmount currency={data.currency} amount={data.amount} />
      </TableCell>
      <TableCell className="w-[280px]">{data.method}</TableCell>
      <TableCell className="w-[180px]">
        <AssignedUser user={data.assigned} />
      </TableCell>
      <TableCell>
        {fullfilled ? <Icons.Check /> : <Icons.AlertCircle />}{" "}
      </TableCell>
    </TableRow>
  );
}

export function DataTable({ data, fetchMore }: ItemsProps) {
  const fetching = useRef(false);
  const [items, setItems] = useState<React.JSX.Element[]>(data);

  const loadMore = async (page: number) => {
    if (!fetching.current) {
      try {
        fetching.current = true;
        const data = await fetchMore(page);
        setItems((prev) => [...prev, ...data]);
      } finally {
        fetching.current = false;
      }
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[380px]">To/From</TableHead>
              <TableHead className="w-[170px]">Date</TableHead>
              <TableHead className="w-[250px]">Amount</TableHead>
              <TableHead className="w-[280px]">Method</TableHead>
              <TableHead className="w-[180px]">Assigned</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <InfiniteScroll
            // hasMore={hasMore}
            hasMore={true}
            loadMore={loadMore}
            pageStart={0}
            element="tbody"
          >
            {items.map((row) => (
              <DataTableRow key={row.id} data={row} />
            ))}
          </InfiniteScroll>
        </Table>
      </div>

      {/* {hasMore && (
        <div className="mt-4 flex justify-center items-center">
          <span className="text-[#606060] text-sm">Loading...</span>
        </div>
      )} */}
    </>
  );
}
