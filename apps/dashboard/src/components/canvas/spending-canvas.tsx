"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { spendingArtifact } from "@api/ai/artifacts/spending";
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
import {
  BaseCanvas,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import {
  Skeleton,
  SkeletonCard,
  SkeletonLine,
} from "@/components/canvas/base/skeleton";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";

export function SpendingCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(spendingArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const { setParams } = useTransactionParams();

  const _isLoading = status === "loading";
  const stage = data?.stage;

  const transactions = data?.transactions || [];
  const metrics = data?.metrics;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

  const showTransactions =
    stage && ["metrics_ready", "analysis_ready"].includes(stage);
  const showCards =
    stage && ["metrics_ready", "analysis_ready"].includes(stage);
  const showSummary = stage === "analysis_ready";

  return (
    <BaseCanvas>
      <CanvasHeader title="Spending" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Largest transactions section */}
          {showTransactions ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
                  Largest transactions
                </h4>
                <Link
                  href="/transactions"
                  className="text-[12px] text-[#707070] dark:text-[#666666] hover:underline"
                >
                  View all transactions
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
                        Vendor
                      </TableHead>
                      <TableHead className="text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Category
                      </TableHead>
                      <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Amount
                      </TableHead>
                      <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                        Share
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        onClick={() =>
                          setParams({ transactionId: transaction.id })
                        }
                        className={cn(
                          "cursor-pointer hover:bg-[#F2F1EF] dark:hover:bg-[#0f0f0f] transition-colors",
                          index === transactions.slice(0, 10).length - 1 &&
                            "border-b-0",
                        )}
                      >
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {transaction.vendor}
                        </TableCell>
                        <TableCell className="text-[12px] text-black dark:text-white">
                          {transaction.category}
                        </TableCell>
                        <TableCell className="text-right text-[12px] text-black dark:text-white font-sans">
                          {formatAmount({
                            currency,
                            amount: transaction.amount,
                            locale,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-[12px] text-[#707070] dark:text-[#666666]">
                          {transaction.share.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-[12px] text-[#707070] dark:text-[#666666] py-8 text-center">
                  No transactions found
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton width="8rem" height="1.125rem" />
                <Skeleton width="6rem" height="0.875rem" />
              </div>
              <div className="border border-[#e6e6e6] dark:border-[#1d1d1d]">
                <div className="p-3 space-y-3">
                  {Array.from(
                    { length: 5 },
                    (_, i) => `skeleton-transaction-row-${i}`,
                  ).map((key) => (
                    <SkeletonLine key={key} width="100%" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Two summary cards */}
          {showCards ? (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
                <div className="text-[12px] text-[#707070] dark:text-[#666666] mb-1">
                  Spending this month
                </div>
                <div className="text-[18px] font-normal font-sans text-black dark:text-white mb-1">
                  {metrics?.currentMonthSpending
                    ? formatAmount({
                        currency,
                        amount: metrics.currentMonthSpending,
                        locale,
                      })
                    : formatAmount({
                        currency,
                        amount: 0,
                        locale,
                      })}
                </div>
                <div className="text-[10px] text-[#707070] dark:text-[#666666]">
                  Across {transactions.length} high-value transaction
                  {transactions.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
                <div className="text-[12px] text-[#707070] dark:text-[#666666] mb-1">
                  Top category
                </div>
                <div className="text-[18px] font-normal font-sans text-black dark:text-white mb-1">
                  {metrics?.topCategory
                    ? `${metrics.topCategory.name} — ${formatAmount({
                        currency,
                        amount: metrics.topCategory.amount,
                        locale,
                      })}`
                    : "—"}
                </div>
                <div className="text-[10px] text-[#707070] dark:text-[#666666]">
                  Largest share of monthly spend
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Array.from(
                { length: 2 },
                (_, i) => `skeleton-summary-card-${i}`,
              ).map((key) => (
                <SkeletonCard key={key}>
                  <SkeletonLine width="5rem" />
                  <Skeleton width="8rem" height="1.125rem" className="mb-1" />
                  <SkeletonLine width="6rem" />
                </SkeletonCard>
              ))}
            </div>
          )}

          {/* Summary & Recommendations section */}
          <CanvasSection
            title="Summary & Recommendations"
            isLoading={!showSummary}
          >
            {data?.analysis?.summary && (
              <div className="space-y-3">
                <div className="whitespace-pre-wrap">
                  {data.analysis.summary}
                </div>
              </div>
            )}
          </CanvasSection>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
