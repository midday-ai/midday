"use client";

import { FormatAmount } from "@/components/format-amount";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { AllCaughtUp } from "@/components/tables/reconciliation/empty-states";
import { useReconciliationFilterParams } from "@/hooks/use-reconciliation-filter-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { toast } from "@midday/ui/use-toast";
import { formatDate } from "@midday/utils/format";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

const discrepancyTypeConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  nsf: {
    label: "NSF",
    color: "text-[#FF3638]",
    bg: "bg-[#FF3638]/10",
  },
  partial_payment: {
    label: "Partial",
    color: "text-[#F97316]",
    bg: "bg-[#FFEDD5] dark:bg-[#F97316]/10",
  },
  overpayment: {
    label: "Overpayment",
    color: "text-[#FFD02B]",
    bg: "bg-[#FFD02B]/10",
  },
  unrecognized: {
    label: "Unrecognized",
    color: "text-[#878787]",
    bg: "bg-[#F2F1EF] dark:bg-[#1D1D1D]",
  },
  bank_fee: {
    label: "Bank Fee",
    color: "text-[#878787]",
    bg: "bg-[#F2F1EF] dark:bg-[#1D1D1D]",
  },
  duplicate: {
    label: "Duplicate",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  split_payment: {
    label: "Split",
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/30",
  },
};

function DiscrepancyTypeBadge({ type }: { type: string | null }) {
  if (!type || !(type in discrepancyTypeConfig)) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  const config = discrepancyTypeConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        config.bg,
        config.color,
      )}
    >
      {config.label}
    </span>
  );
}

export function DiscrepancyQueue() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { filter } = useReconciliationFilterParams();

  const { data } = useSuspenseQuery(
    trpc.reconciliation.getDiscrepancies.queryOptions({
      start: filter.start ?? undefined,
      end: filter.end ?? undefined,
      bankAccountIds: filter.accounts ?? undefined,
    }),
  );

  const flagMutation = useMutation(
    trpc.reconciliation.flagDiscrepancy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getDiscrepancies.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getStats.queryKey(),
        });
        toast({ title: "Discrepancy flagged", variant: "success" });
      },
    }),
  );

  const resolveMutation = useMutation(
    trpc.reconciliation.resolveDiscrepancy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getDiscrepancies.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getStats.queryKey(),
        });
        toast({ title: "Discrepancy resolved", variant: "success" });
      },
    }),
  );

  const discrepancies = data?.data ?? [];

  if (discrepancies.length === 0) {
    return <AllCaughtUp />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead className="w-[250px]">Description</TableHead>
          <TableHead className="w-[120px]">Amount</TableHead>
          <TableHead className="w-[100px]">Type</TableHead>
          <TableHead className="w-[120px]">Status</TableHead>
          <TableHead className="w-[80px]">Aging</TableHead>
          <TableHead className="w-[200px]">Suggested Match</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {discrepancies.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="text-sm tabular-nums">
              {formatDate(item.date)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm truncate max-w-[240px]">
                  {item.name}
                </span>
                {item.counterpartyName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {item.counterpartyName}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <FormatAmount amount={item.amount} currency={item.currency} />
            </TableCell>
            <TableCell>
              <DiscrepancyTypeBadge type={item.discrepancyType} />
            </TableCell>
            <TableCell>
              <MatchStatusBadge status={item.matchStatus} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground tabular-nums">
              {item.agingDays != null ? `${item.agingDays}d` : "-"}
            </TableCell>
            <TableCell>
              {item.matchSuggestions?.[0] ? (
                <span className="text-xs text-muted-foreground truncate">
                  {item.matchSuggestions[0].merchantName} (
                  {Math.round(item.matchSuggestions[0].confidence * 100)}%)
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Icons.MoreHoriz size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {item.matchSuggestions?.[0] && (
                    <DropdownMenuItem>
                      Match to {item.matchSuggestions[0].merchantName}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() =>
                      flagMutation.mutate({
                        transactionId: item.id,
                        discrepancyType: item.discrepancyType ?? "unrecognized",
                      })
                    }
                  >
                    Flag for review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      resolveMutation.mutate({
                        transactionId: item.id,
                        resolution: "excluded",
                      })
                    }
                  >
                    Mark as bank fee / non-deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
