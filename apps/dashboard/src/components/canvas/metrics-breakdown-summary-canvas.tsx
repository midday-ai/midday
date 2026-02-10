"use client";

import { useArtifact, useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { metricsBreakdownSummaryArtifact } from "@api/ai/artifacts/metrics-breakdown";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  BaseCanvas,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import {
  formatCurrencyAmount,
  shouldShowSummarySkeleton,
} from "@/components/canvas/utils";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";
import { isMonthlyBreakdownType } from "@/lib/metrics-breakdown-constants";
import { formatAmount } from "@/utils/format";

export function MetricsBreakdownSummaryCanvas() {
  const [selectedType] = useQueryState("artifact-type", parseAsString);
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));

  // Check if this is a monthly breakdown artifact
  const isMonthlyBreakdown =
    selectedType && isMonthlyBreakdownType(selectedType);

  // Use useArtifacts to get all artifacts including monthly ones
  const [artifactsData] = useArtifacts({
    value: selectedType ?? undefined,
    exclude: ["chat-title", "suggestions"],
  });

  const [standardArtifact] = useArtifact(metricsBreakdownSummaryArtifact, {
    version,
  });

  // Get the appropriate artifact data
  // For monthly breakdowns, get artifact from byType or current
  // For standard breakdowns, use the standard artifact
  let artifactData: {
    data: typeof standardArtifact.data;
    status: typeof standardArtifact.status;
  };

  if (isMonthlyBreakdown && selectedType) {
    // Try to get artifact from current first (if it matches selectedType)
    // Otherwise get from byType
    let selectedArtifact = null;

    if (artifactsData.current?.type === selectedType) {
      selectedArtifact = artifactsData.current;
    } else {
      const monthlyArtifacts = artifactsData.byType[selectedType] || [];
      // Get the latest artifact (last in array) or by version
      selectedArtifact =
        monthlyArtifacts[version] ??
        monthlyArtifacts[monthlyArtifacts.length - 1] ??
        monthlyArtifacts[0];
    }

    if (selectedArtifact) {
      const payload = selectedArtifact.payload as typeof standardArtifact.data;
      // Derive status from stage - if stage is loading, status should be loading
      const derivedStatus =
        payload?.stage === "loading" ? "loading" : standardArtifact.status;
      artifactData = {
        data: payload,
        status: derivedStatus,
      };
    } else {
      // Artifact not found yet, show loading state
      artifactData = {
        data: { stage: "loading" } as typeof standardArtifact.data,
        status: "loading",
      };
    }
  } else {
    artifactData = {
      data: standardArtifact.data,
      status: standardArtifact.status,
    };
  }

  const { data, status } = artifactData;
  const { data: user } = useUserQuery();
  const { setParams } = useTransactionParams();
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

  const summary = data?.summary;
  const transactions = data?.transactions || [];
  const categories = data?.categories || [];
  const showData = stage && ["metrics_ready", "analysis_ready"].includes(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  // Calculate top category
  const topCategory = categories.length > 0 ? categories[0] : null;
  const topCategoryPercentage =
    topCategory && summary && summary.expenses > 0
      ? (topCategory.amount / summary.expenses) * 100
      : 0;

  // Get month name for canvas title from artifact displayDate or from date
  const monthLabel = data?.displayDate
    ? format(parseISO(data.displayDate), "MMM")
    : data?.from
      ? format(parseISO(data.from), "MMM")
      : null;

  const canvasTitle = monthLabel
    ? `Transactions — ${monthLabel}`
    : "Breakdown Summary";

  return (
    <BaseCanvas>
      <CanvasHeader title={canvasTitle} />

      <CanvasContent>
        <div className="space-y-6">
          {/* Transactions Table */}
          {showData && transactions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
                  Transactions — {monthLabel}
                </h4>
                {data?.from && data?.to && (
                  <Link
                    href={`/transactions?start=${data.from}&end=${data.to}`}
                    className="text-[#707070] text-xs dark:text-[#666666] hover:underline mt-auto"
                  >
                    View all transactions
                  </Link>
                )}
              </div>
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
                    <TableHead className="text-right text-[12px] text-[#707070] dark:text-[#666666] font-normal">
                      Share
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index, array) => (
                    <TableRow
                      key={tx.id}
                      onClick={() => setParams({ transactionId: tx.id })}
                      className={cn(
                        "h-10 cursor-pointer hover:bg-[#F2F1EF] dark:hover:bg-[#0f0f0f] transition-colors",
                        index === array.length - 1 && "border-b-0",
                      )}
                    >
                      <TableCell className="text-[12px] text-black dark:text-white py-0 px-3 align-middle">
                        <div
                          className="truncate whitespace-nowrap"
                          title={tx.date}
                        >
                          {tx.date}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-black dark:text-white py-0 px-3 align-middle max-w-[200px]">
                        <div className="truncate" title={tx.name}>
                          {tx.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-[#707070] dark:text-[#666666] py-0 px-3 align-middle max-w-[150px]">
                        <div className="truncate" title={tx.category}>
                          {tx.category}
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-[12px] font-medium py-0 px-3 align-middle",
                          tx.type === "income"
                            ? "text-green-600 dark:text-green-400"
                            : "text-black dark:text-white",
                        )}
                      >
                        <div className="truncate whitespace-nowrap">
                          {tx.type === "income" ? "+" : "-"}
                          {tx.formattedAmount}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-[#707070] dark:text-[#666666] py-0 px-3 align-middle">
                        <div className="truncate whitespace-nowrap">
                          {tx.percentage?.toFixed(1)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Two Cards */}
          {showData && summary && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Total Spending Card */}
              <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
                <div className="text-[12px] text-[#707070] dark:text-[#666666] mb-1">
                  {monthLabel
                    ? `Total spending in ${monthLabel}`
                    : "Total spending"}
                </div>
                <div className="text-[18px] font-normal font-sans text-black dark:text-white mb-1">
                  {formatCurrencyAmount(summary.expenses, currency, locale)}
                </div>
                <div className="text-[10px] text-[#707070] dark:text-[#666666]">
                  Across {summary.transactionCount} transaction
                  {summary.transactionCount !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Top Category Card */}
              <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
                <div className="text-[12px] text-[#707070] dark:text-[#666666] mb-1">
                  Top category
                </div>
                <div className="text-[18px] font-normal font-sans text-black dark:text-white mb-1">
                  {topCategory
                    ? `${topCategory.name} — ${formatAmount({
                        currency,
                        amount: topCategory.amount,
                        locale,
                      })}`
                    : "—"}
                </div>
                <div className="text-[10px] text-[#707070] dark:text-[#666666]">
                  {topCategoryPercentage > 0
                    ? `${topCategoryPercentage.toFixed(1)}% of total expenses`
                    : "Largest share of monthly spend"}
                </div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
