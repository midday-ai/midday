"use client";

import { BaseCanvas, CanvasHeader } from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { useUserQuery } from "@/hooks/use-user";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { metricsBreakdownTransactionsArtifact } from "@api/ai/artifacts/metrics-breakdown";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";

export function MetricsBreakdownTransactionsCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(metricsBreakdownTransactionsArtifact, {
    version,
  });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const stage = data?.stage;
  const transactions = data?.transactions || [];
  const showData = stage && ["metrics_ready", "analysis_ready"].includes(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Transactions" />

      <CanvasContent>
        <div className="space-y-8">
          {showData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
                  Transactions
                </h4>
                <Link
                  href="/transactions"
                  className="text-[12px] text-[#707070] dark:text-[#666666] hover:underline"
                >
                  View all
                </Link>
              </div>
              {transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0">
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Date
                      </TableHead>
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Name
                      </TableHead>
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Category
                      </TableHead>
                      <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 50).map((tx, index) => (
                      <TableRow
                        key={tx.id}
                        className={cn(
                          index === transactions.slice(0, 50).length - 1 &&
                            "border-b-0",
                        )}
                      >
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {tx.date}
                        </TableCell>
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {tx.name}
                        </TableCell>
                        <TableCell className="text-[12px] text-[#707070] dark:text-[#666666]">
                          {tx.category}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right text-[12px] font-medium",
                            tx.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-black dark:text-white",
                          )}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {tx.formattedAmount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-[12px] text-[#707070] dark:text-[#666666]">
                  No transactions found
                </p>
              )}
            </div>
          )}
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
