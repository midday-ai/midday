"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { balanceSheetArtifact } from "@api/ai/artifacts/balance-sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { format, parseISO } from "date-fns";
import { parseAsInteger, useQueryState } from "nuqs";
import { BaseCanvas, CanvasHeader } from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { Skeleton } from "@/components/canvas/base/skeleton";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";

function getBalanceSheetTooltip(item: string): string {
  const tooltips: Record<string, string> = {
    cash: "Sum of all bank account balances (depository accounts)",
    accountsReceivable:
      "Unpaid invoices that represent money owed to the business",
    inventory: "Transactions categorized as inventory",
    prepaidExpenses: "Transactions categorized as prepaid expenses",
    fixedAssets: "Transactions categorized as fixed assets and equipment",
    accumulatedDepreciation:
      "Depreciation calculated based on asset age using straight-line method (5 years for equipment, 3 years for software)",
    softwareTechnology: "Transactions categorized as software",
    longTermInvestments:
      "Long-term investment transactions (currently not tracked)",
    otherAssets: "Other asset account balances",
    accountsPayable: "Unmatched bills and vendor invoices from inbox",
    accruedExpenses:
      "Expenses incurred but not yet paid (currently not tracked)",
    shortTermDebt: "Short-term loan obligations",
    creditCardDebt: "Credit card account balances",
    longTermDebt: "Loan proceeds minus repayments, plus loan account balances",
    deferredRevenue: "Transactions categorized as deferred revenue",
    leases: "Transactions categorized as leases",
    otherLiabilities: "Other liability account balances",
    capitalInvestment: "Transactions categorized as capital investment",
    ownerDraws: "Transactions categorized as owner draws",
    retainedEarnings:
      "Total revenue minus total expenses (excluding asset purchases)",
  };

  return tooltips[item] || "";
}

export function BalanceSheetCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(balanceSheetArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();

  const _isLoading = status === "loading";
  const stage = data?.stage;
  const balanceSheet = data?.balanceSheet;
  const metrics = data?.metrics;
  const currency = data?.currency || "USD";
  const asOf = data?.asOf
    ? format(parseISO(data.asOf), "MMMM dd, yyyy")
    : undefined;

  // Format financial ratios for display
  const ratioMetrics = metrics
    ? [
        {
          id: "current-ratio",
          title: "Current Ratio",
          value: metrics.currentRatio
            ? `${metrics.currentRatio.toFixed(2)}:1`
            : "0.00:1",
          subtitle:
            // If no current liabilities, show excellent liquidity
            balanceSheet?.liabilities.current.total === 0
              ? "Excellent liquidity position"
              : metrics.currentRatio && metrics.currentRatio >= 2
                ? "Strong liquidity position"
                : metrics.currentRatio && metrics.currentRatio >= 1
                  ? "Adequate liquidity"
                  : "Low liquidity",
        },
        {
          id: "debt-to-equity",
          title: "Debt-to-Equity",
          value: metrics.debtToEquity
            ? `${metrics.debtToEquity.toFixed(2)}:1`
            : "0.00:1",
          subtitle:
            // If no debt, show excellent debt position
            balanceSheet?.liabilities.total === 0
              ? "No debt - excellent position"
              : metrics.debtToEquity && metrics.debtToEquity < 1
                ? "Conservative debt level"
                : metrics.debtToEquity && metrics.debtToEquity > 2
                  ? "High debt level"
                  : "Moderate debt level",
        },
        {
          id: "working-capital",
          title: "Working Capital",
          value:
            metrics.workingCapital !== undefined
              ? formatAmount({
                  currency,
                  amount: metrics.workingCapital,
                  locale: user?.locale,
                }) ||
                formatAmount({
                  currency: data?.currency || "USD",
                  amount: 0,
                  locale: user?.locale,
                })
              : formatAmount({
                  currency: data?.currency || "USD",
                  amount: 0,
                  locale: user?.locale,
                }),
          subtitle: "Current assets - current liabilities",
        },
        {
          id: "equity-ratio",
          title: "Equity Ratio",
          value: metrics.equityRatio
            ? `${metrics.equityRatio.toFixed(1)}%`
            : "0.0%",
          subtitle:
            metrics.equityRatio && metrics.equityRatio >= 50
              ? "Strong equity position"
              : metrics.equityRatio && metrics.equityRatio < 30
                ? "Low equity position"
                : "Moderate equity position",
        },
      ]
    : [];

  const showDataSkeleton = !stage || stage === "loading";

  return (
    <BaseCanvas>
      <CanvasHeader title="Financial Position" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Balance Sheet Table */}
          {balanceSheet && (
            <div className="mb-6">
              {/* Title */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
                  Balance Sheet
                </h4>

                {asOf && (
                  <div className="text-[12px] text-[#707070] dark:text-[#666666]">
                    As of {asOf}
                  </div>
                )}
              </div>

              {/* Balance Sheet Table */}
              <div className="border bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] rounded-none">
                {/* Header */}
                <div className="flex border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-[#707070] dark:text-[#666666]">
                    ASSETS
                  </div>
                  <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-right text-[#707070] dark:text-[#666666]">
                    Amount
                  </div>
                </div>

                {/* Current Assets */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Current Assets
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Cash and Cash Equivalents
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("cash")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.current.cash,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Accounts Receivable
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("accountsReceivable")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.current.accountsReceivable,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.assets.current.inventoryName ||
                              "Inventory (Cost of Goods Sold)"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("inventory")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.current.inventory,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.assets.current.prepaidExpensesName ||
                              "Prepaid Expenses"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("prepaidExpenses")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.current.prepaidExpenses,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Total Current Assets
                    </div>
                    <div className="text-[12px] font-sans font-medium text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.current.total,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                </div>

                {/* Non-Current Assets */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Non-Current Assets
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.assets.nonCurrent.fixedAssetsName ||
                              "Fixed Assets (Equipment)"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("fixedAssets")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.nonCurrent.fixedAssets,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Accumulated Depreciation
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("accumulatedDepreciation")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.assets.nonCurrent
                            .accumulatedDepreciation,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.assets.nonCurrent
                              .softwareTechnologyName ||
                              "Software & Technology"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("softwareTechnology")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.assets.nonCurrent.softwareTechnology,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.assets.nonCurrent
                              .longTermInvestmentsName ||
                              "Long-term Investments"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("longTermInvestments")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.assets.nonCurrent.longTermInvestments,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Other Assets
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("otherAssets")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.nonCurrent.otherAssets,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Total Non-Current Assets
                    </div>
                    <div className="text-[12px] font-sans font-medium text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.assets.nonCurrent.total,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                </div>

                {/* Total Assets */}
                <div className="px-4 py-3 flex justify-between border-b border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#0f0f0f]">
                  <div className="text-[14px] font-medium text-black dark:text-white">
                    Total Assets
                  </div>
                  <div className="text-[14px] font-sans font-medium text-black dark:text-white">
                    {formatAmount({
                      currency,
                      amount: balanceSheet.assets.total,
                      locale: user?.locale,
                    })}
                  </div>
                </div>

                {/* Liabilities and Equity Header */}
                <div className="flex border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-[#707070] dark:text-[#666666]">
                    LIABILITIES & EQUITY
                  </div>
                  <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-right text-[#707070] dark:text-[#666666]">
                    Amount
                  </div>
                </div>

                {/* Current Liabilities */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Current Liabilities
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Accounts Payable
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("accountsPayable")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.liabilities.current.accountsPayable,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.liabilities.current
                              .accruedExpensesName ||
                              "Accrued Expenses (Operations)"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("accruedExpenses")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.liabilities.current.accruedExpenses,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Short-term Debt (Banking & Finance)
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("shortTermDebt")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.liabilities.current.shortTermDebt,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.liabilities.current
                              .creditCardDebtName || "Credit Card Debt"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("creditCardDebt")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.liabilities.current.creditCardDebt,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Total Current Liabilities
                    </div>
                    <div className="text-[12px] font-sans font-medium text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.liabilities.current.total,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                </div>

                {/* Non-Current Liabilities */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Non-Current Liabilities
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Long-term Debt (Banking & Finance)
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("longTermDebt")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.liabilities.nonCurrent.longTermDebt,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.liabilities.nonCurrent
                              .deferredRevenueName ||
                              "Deferred Revenue (Liabilities & Debt)"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("deferredRevenue")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.liabilities.nonCurrent.deferredRevenue,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.liabilities.nonCurrent.leasesName ||
                              "Leases"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("leases")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.liabilities.nonCurrent.leases,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Other Liabilities
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("otherLiabilities")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount:
                          balanceSheet.liabilities.nonCurrent.otherLiabilities,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Total Non-Current Liabilities
                    </div>
                    <div className="text-[12px] font-sans font-medium text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.liabilities.nonCurrent.total,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                </div>

                {/* Total Liabilities */}
                <div className="px-4 py-3 flex justify-between border-b border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#0f0f0f]">
                  <div className="text-[14px] font-medium text-black dark:text-white">
                    Total Liabilities
                  </div>
                  <div className="text-[14px] font-sans font-medium text-black dark:text-white">
                    {formatAmount({
                      currency,
                      amount: balanceSheet.liabilities.total,
                      locale: user?.locale,
                    })}
                  </div>
                </div>

                {/* Equity */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Equity
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.equity.capitalInvestmentName ||
                              "Capital Investment"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("capitalInvestment")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.equity.capitalInvestment,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            {balanceSheet.equity.ownerDrawsName ||
                              "Owner Draws"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("ownerDraws")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.equity.ownerDraws,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[12px] pl-4 text-[#707070] dark:text-[#666666] cursor-help">
                            Retained Earnings
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={5}
                          className="text-xs p-1.5"
                        >
                          {getBalanceSheetTooltip("retainedEarnings")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-[12px] font-sans text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.equity.retainedEarnings,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <div className="text-[12px] font-medium text-black dark:text-white">
                      Total Equity
                    </div>
                    <div className="text-[12px] font-sans font-medium text-black dark:text-white">
                      {formatAmount({
                        currency,
                        amount: balanceSheet.equity.total,
                        locale: user?.locale,
                      })}
                    </div>
                  </div>
                </div>

                {/* Total Liabilities and Equity */}
                <div className="px-4 py-3 flex justify-between bg-[#f7f7f7] dark:bg-[#0f0f0f]">
                  <div className="text-[14px] font-medium text-black dark:text-white">
                    Total Liabilities & Equity
                  </div>
                  <div className="text-[14px] font-sans font-medium text-black dark:text-white">
                    {formatAmount({
                      currency,
                      amount:
                        balanceSheet.liabilities.total +
                        balanceSheet.equity.total,
                      locale: user?.locale,
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show skeleton while loading */}
          {showDataSkeleton && !balanceSheet && (
            <div className="mb-6">
              {/* Title */}
              <div className="flex items-center justify-between mb-4">
                <Skeleton width="8rem" height="1.125rem" />
                <Skeleton width="6rem" height="0.75rem" />
              </div>

              {/* Balance Sheet Table */}
              <div className="border bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] rounded-none">
                {/* Header */}
                <div className="flex border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="w-1/2 px-4 py-3">
                    <Skeleton width="3rem" height="0.75rem" />
                  </div>
                  <div className="w-1/2 px-4 py-3 text-right">
                    <Skeleton
                      width="3rem"
                      height="0.75rem"
                      className="ml-auto"
                    />
                  </div>
                </div>

                {/* Current Assets */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="5rem" height="0.75rem" />
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-2 flex justify-between">
                      <Skeleton
                        width="8rem"
                        height="0.75rem"
                        className="pl-4"
                      />
                      <Skeleton width="4rem" height="0.75rem" />
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="6rem" height="0.75rem" />
                    <Skeleton width="4rem" height="0.75rem" />
                  </div>
                </div>

                {/* Non-Current Assets */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="7rem" height="0.75rem" />
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-2 flex justify-between">
                      <Skeleton
                        width="9rem"
                        height="0.75rem"
                        className="pl-4"
                      />
                      <Skeleton width="4rem" height="0.75rem" />
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="8rem" height="0.75rem" />
                    <Skeleton width="4rem" height="0.75rem" />
                  </div>
                </div>

                {/* Total Assets */}
                <div className="px-4 py-3 flex justify-between border-b border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#0f0f0f]">
                  <Skeleton width="5rem" height="0.875rem" />
                  <Skeleton width="4rem" height="0.875rem" />
                </div>

                {/* Liabilities and Equity Header */}
                <div className="flex border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="w-1/2 px-4 py-3">
                    <Skeleton width="8rem" height="0.75rem" />
                  </div>
                  <div className="w-1/2 px-4 py-3 text-right">
                    <Skeleton
                      width="3rem"
                      height="0.75rem"
                      className="ml-auto"
                    />
                  </div>
                </div>

                {/* Current Liabilities */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="7rem" height="0.75rem" />
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-2 flex justify-between">
                      <Skeleton
                        width="7rem"
                        height="0.75rem"
                        className="pl-4"
                      />
                      <Skeleton width="4rem" height="0.75rem" />
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="8rem" height="0.75rem" />
                    <Skeleton width="4rem" height="0.75rem" />
                  </div>
                </div>

                {/* Non-Current Liabilities */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="10rem" height="0.75rem" />
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-2 flex justify-between">
                      <Skeleton
                        width="9rem"
                        height="0.75rem"
                        className="pl-4"
                      />
                      <Skeleton width="4rem" height="0.75rem" />
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="11rem" height="0.75rem" />
                    <Skeleton width="4rem" height="0.75rem" />
                  </div>
                </div>

                {/* Total Liabilities */}
                <div className="px-4 py-3 flex justify-between border-b border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#0f0f0f]">
                  <Skeleton width="6rem" height="0.875rem" />
                  <Skeleton width="4rem" height="0.875rem" />
                </div>

                {/* Equity */}
                <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
                  <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="3rem" height="0.75rem" />
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-4 py-2 flex justify-between">
                      <Skeleton
                        width="7rem"
                        height="0.75rem"
                        className="pl-4"
                      />
                      <Skeleton width="4rem" height="0.75rem" />
                    </div>
                  ))}
                  <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
                    <Skeleton width="5rem" height="0.75rem" />
                    <Skeleton width="4rem" height="0.75rem" />
                  </div>
                </div>

                {/* Total Liabilities and Equity */}
                <div className="px-4 py-3 flex justify-between bg-[#f7f7f7] dark:bg-[#0f0f0f]">
                  <Skeleton width="11rem" height="0.875rem" />
                  <Skeleton width="4rem" height="0.875rem" />
                </div>
              </div>
            </div>
          )}

          {/* Financial Ratios Grid */}
          {metrics && (
            <div className="grid grid-cols-2 gap-3 mb-16">
              {ratioMetrics.map((item) => (
                <div
                  key={item.id}
                  className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] rounded-none"
                >
                  <div className="text-[12px] mb-1 text-[#707070] dark:text-[#666666]">
                    {item.title}
                  </div>
                  <div className="text-[18px] font-normal font-sans text-black dark:text-white mb-1">
                    {item.value}
                  </div>
                  {item.subtitle && (
                    <div className="text-[10px] mt-1 text-[#707070] dark:text-[#666666]">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Section */}
          {data?.analysis?.summary && (
            <div className="mt-8 mb-4">
              <h3 className="text-[12px] leading-normal mb-3 text-[#707070] dark:text-[#666666]">
                Summary
              </h3>
              <div className="text-[12px] leading-[17px] font-sans text-black dark:text-white">
                {data.analysis.summary}
              </div>
            </div>
          )}
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
