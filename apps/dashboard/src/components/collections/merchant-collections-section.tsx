"use client";

import { useTRPC } from "@/trpc/client";
import { FormatAmount } from "@/components/format-amount";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import Link from "next/link";

type Props = {
  merchantId: string;
};

const OUTCOME_LABELS: Record<string, string> = {
  paid_in_full: "Paid in Full",
  settled: "Settled",
  payment_plan: "Payment Plan",
  defaulted: "Defaulted",
  written_off: "Written Off",
  sent_to_agency: "Sent to Agency",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  medium: "text-[#FFD02B] bg-[#FFD02B]/10",
  high: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  critical: "text-[#FF3638] bg-[#FF3638]/10",
};

export function MerchantCollectionsSection({ merchantId }: Props) {
  const trpc = useTRPC();

  const { data: cases } = useQuery(
    trpc.collections.getByMerchantId.queryOptions({ merchantId }),
  );

  if (!cases || cases.length === 0) return null;

  const activeCases = cases.filter((c) => !c.resolvedAt);
  const resolvedCases = cases.filter((c) => c.resolvedAt);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-medium">Collections</h2>
          {activeCases.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-[#FF3638] bg-[#FF3638]/10 rounded">
              {activeCases.length} active
            </span>
          )}
        </div>
        <span className="text-xs text-[#606060]">
          {cases.length} total case{cases.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-background border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-[12px] font-medium text-[#606060]">
                Deal
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                Stage
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                Priority
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                Balance
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                Outcome
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[#606060]">
                Agency
              </TableHead>
              <TableHead className="text-[12px] font-medium text-[#606060]">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow
                key={c.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <Link
                    href={`/collections/${c.id}`}
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    {c.dealCode}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  {c.stageName ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{
                          backgroundColor: c.stageColor || "#0ea5e9",
                        }}
                      />
                      {c.stageName}
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#878787]">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {c.priority && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                        PRIORITY_COLORS[c.priority] ?? "bg-muted text-[#606060]",
                      )}
                    >
                      {c.priority}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-[12px] text-right">
                  <FormatAmount amount={c.currentBalance} currency="USD" />
                </TableCell>
                <TableCell className="text-center">
                  {c.outcome ? (
                    <span className="text-[11px] text-[#606060] capitalize">
                      {OUTCOME_LABELS[c.outcome] ?? c.outcome}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#878787]">Active</span>
                  )}
                </TableCell>
                <TableCell className="text-[12px] text-[#606060]">
                  {c.agencyName ?? "—"}
                </TableCell>
                <TableCell className="text-[11px] text-[#606060]">
                  {c.enteredCollectionsAt
                    ? format(
                        new TZDate(c.enteredCollectionsAt, "UTC"),
                        "MMM d, yyyy",
                      )
                    : c.createdAt
                      ? format(
                          new TZDate(c.createdAt, "UTC"),
                          "MMM d, yyyy",
                        )
                      : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
