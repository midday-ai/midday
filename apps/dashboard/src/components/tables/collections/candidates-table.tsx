"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { useCallback } from "react";

export function CandidatesTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.collections.getCandidates.infiniteQueryOptions(
        { pageSize: 25 },
        { getNextPageParam: ({ meta }) => meta?.cursor },
      ),
    );

  const createMutation = useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getCandidates.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collections.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collections.getStats.queryKey(),
        });
      },
    }),
  );

  const handleMoveToCollections = useCallback(
    (dealId: string) => {
      createMutation.mutate({ dealId });
    },
    [createMutation],
  );

  const candidates = data?.pages.flatMap((page) => page.data) ?? [];

  if (!candidates.length) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center mt-40">
          <div className="text-center mb-6 space-y-2">
            <h2 className="font-medium text-lg">No candidates</h2>
            <p className="text-[#606060] text-sm">
              There are no deals currently eligible for collections.
              <br />
              Deals with late or defaulted status will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    late: "text-[#f97316] bg-[#f97316]/10",
    defaulted: "text-[#FF3638] bg-[#FF3638]/10",
    in_collections: "text-[#8b5cf6] bg-[#8b5cf6]/10",
  };

  return (
    <div className="border border-border">
      <Table>
        <TableHeader>
          <TableRow className="h-[45px] hover:bg-transparent">
            <TableHead className="w-[200px]">Merchant</TableHead>
            <TableHead className="w-[120px]">Deal Code</TableHead>
            <TableHead className="w-[120px]">Balance</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[80px]">NSFs</TableHead>
            <TableHead className="w-[120px]">Funded</TableHead>
            <TableHead className="w-[100px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((deal) => (
            <TableRow key={deal.dealId} className="h-[45px]">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[9px] font-medium">
                      {deal.merchantName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium text-sm">
                    {deal.merchantName || "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">
                  {deal.dealCode || "-"}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {deal.currentBalance ? (
                    <FormatAmount
                      amount={Number(deal.currentBalance)}
                      currency="USD"
                    />
                  ) : (
                    "-"
                  )}
                </span>
              </TableCell>
              <TableCell>
                {deal.status && (
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-full inline-flex text-[11px] font-medium",
                      statusStyles[deal.status] || "text-[#6b7280] bg-[#6b7280]/10",
                    )}
                  >
                    {deal.status.replace("_", " ")}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "font-mono text-sm",
                    Number(deal.nsfCount) > 0 && "text-[#FF3638] font-medium",
                  )}
                >
                  {deal.nsfCount ?? 0}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-[#606060]">
                  {deal.fundedAt
                    ? new Date(deal.fundedAt).toLocaleDateString()
                    : "-"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleMoveToCollections(deal.dealId)}
                  disabled={createMutation.isPending}
                >
                  Move to Collections
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasNextPage && (
        <div className="flex justify-center py-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
