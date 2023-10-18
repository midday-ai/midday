"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { cn } from "@midday/ui/utils";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
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
        {fullfilled ? <Icons.Check /> : <Icons.AlertCircle />}
      </TableCell>
    </TableRow>
  );
}

export function DataTable({ initialItems, fetchMore }: ItemsProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loadMoreNodes, setLoadMoreNodes] = useState<React.JSX.Element[]>([]);
  const [disabled, setDisabled] = useState(false);
  const currentOffsetRef = useRef(0);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(
    async (abortController?: AbortController) => {
      setLoading(true);

      fetchMore(currentOffsetRef.current)
        .then(([node, next]) => {
          if (abortController?.signal.aborted) return;

          setLoadMoreNodes((prev) => [...prev, node]);
          if (next === null) {
            currentOffsetRef.current ??= undefined;
            setDisabled(true);
            return;
          }

          currentOffsetRef.current = next;
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [fetchMore],
  );

  useEffect(() => {
    const signal = new AbortController();

    const element = ref.current;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && element?.disabled === false) {
        loadMore(signal);
      }
    });

    if (element) {
      observer.observe(element);
    }

    return () => {
      signal.abort();
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [loadMore]);

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
          <TableBody>
            {initialItems?.map((row) => (
              <DataTableRow key={row.id} data={row} />
            ))}

            {loadMoreNodes}
          </TableBody>
        </Table>
      </div>

      <Button
        variant="outline"
        className="w-full mt-4"
        ref={ref}
        disabled={disabled || loading}
        onClick={() => loadMore()}
      >
        {loading ? "Loading..." : "Load More"}
      </Button>
    </>
  );
}
