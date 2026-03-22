"use client";

import { formatAmount } from "@midday/utils/format";

interface BalanceSheetLineItem {
  label: string;
  amount: number;
}

interface BalanceSheetSection {
  current: BalanceSheetLineItem[];
  nonCurrent: BalanceSheetLineItem[];
}

interface EquitySection {
  items: BalanceSheetLineItem[];
}

interface BalanceSheetProps {
  asOf: string;
  currency: string;
  locale?: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: EquitySection;
  ratios?: {
    currentRatio?: number;
    debtToEquity?: number;
    workingCapital?: number;
    equityRatio?: number;
  };
}

const TOOLTIPS: Record<string, string> = {
  "Cash and Cash Equivalents":
    "Sum of all bank account balances (depository accounts)",
  "Accounts Receivable":
    "Unpaid invoices that represent money owed to the business",
  Inventory: "Transactions categorized as inventory",
  "Prepaid Expenses": "Transactions categorized as prepaid expenses",
  "Fixed Assets (Equipment)":
    "Transactions categorized as fixed assets and equipment",
  "Accumulated Depreciation":
    "Depreciation calculated based on asset age using straight-line method",
  "Software & Technology": "Transactions categorized as software",
  "Long-term Investments": "Long-term investment transactions",
  "Other Assets": "Other asset account balances",
  "Accounts Payable": "Unmatched bills and vendor invoices from inbox",
  "Accrued Expenses": "Expenses incurred but not yet paid",
  "Short-term Debt": "Short-term loan obligations",
  "Credit Card Debt": "Credit card account balances",
  "Long-term Debt":
    "Loan proceeds minus repayments, plus loan account balances",
  "Deferred Revenue": "Transactions categorized as deferred revenue",
  Leases: "Transactions categorized as leases",
  "Other Liabilities": "Other liability account balances",
  "Capital Investment": "Transactions categorized as capital investment",
  "Owner Draws": "Transactions categorized as owner draws",
  "Retained Earnings":
    "Total revenue minus total expenses (excluding asset purchases)",
};

function getTooltip(label: string): string | undefined {
  if (TOOLTIPS[label]) return TOOLTIPS[label];
  for (const [key, value] of Object.entries(TOOLTIPS)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return undefined;
}

function RowItem({
  label,
  amount,
  currency,
  locale,
}: {
  label: string;
  amount: number;
  currency: string;
  locale: string;
}) {
  const formatted = formatAmount({
    amount: Math.abs(amount),
    currency,
    locale,
  });
  const isNegative = amount < 0;
  const tooltip = getTooltip(label);

  return (
    <div className="px-4 py-2 flex justify-between">
      <div
        className="text-[12px] pl-4 text-[#707070] dark:text-[#666]"
        title={tooltip}
      >
        {label}
      </div>
      <div className="text-[12px] font-mono text-black dark:text-white">
        {isNegative ? `(${formatted})` : formatted}
      </div>
    </div>
  );
}

function SubtotalRow({
  label,
  amount,
  currency,
  locale,
}: {
  label: string;
  amount: number;
  currency: string;
  locale: string;
}) {
  const formatted = formatAmount({
    amount: Math.abs(amount),
    currency,
    locale,
  });
  const isNegative = amount < 0;

  return (
    <div className="px-4 py-2 flex justify-between border-t border-[#e6e6e6] dark:border-[#1d1d1d] bg-[#f7f7f7] dark:bg-[#131313]">
      <div className="text-[12px] font-medium text-black dark:text-white">
        {label}
      </div>
      <div className="text-[12px] font-mono font-medium text-black dark:text-white">
        {isNegative ? `(${formatted})` : formatted}
      </div>
    </div>
  );
}

function TotalRow({
  label,
  amount,
  currency,
  locale,
}: {
  label: string;
  amount: number;
  currency: string;
  locale: string;
}) {
  const formatted = formatAmount({
    amount: Math.abs(amount),
    currency,
    locale,
  });
  const isNegative = amount < 0;

  return (
    <div className="px-4 py-3 flex justify-between bg-[#f7f7f7] dark:bg-[#0f0f0f]">
      <div className="text-[14px] font-medium text-black dark:text-white">
        {label}
      </div>
      <div className="text-[14px] font-mono font-medium text-black dark:text-white">
        {isNegative ? `(${formatted})` : formatted}
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-[#f7f7f7] dark:bg-[#131313]">
      <div className="text-[12px] font-medium text-black dark:text-white">
        {label}
      </div>
    </div>
  );
}

function sumItems(items: BalanceSheetLineItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function getRatioSubtitle(
  type: "currentRatio" | "debtToEquity" | "equityRatio",
  value: number,
  totalLiabilities?: number,
  currentLiabilitiesTotal?: number,
): string {
  switch (type) {
    case "currentRatio":
      if (currentLiabilitiesTotal === 0) return "Excellent liquidity position";
      if (value >= 2) return "Strong liquidity position";
      if (value >= 1) return "Adequate liquidity";
      return "Low liquidity";
    case "debtToEquity":
      if (totalLiabilities === 0) return "No debt — excellent position";
      if (value < 1) return "Conservative debt level";
      if (value > 2) return "High debt level";
      return "Moderate debt level";
    case "equityRatio":
      if (value >= 50) return "Strong equity position";
      if (value < 30) return "Low equity position";
      return "Moderate equity position";
    default:
      return "";
  }
}

export function BalanceSheet({
  asOf,
  currency,
  locale = "en-US",
  assets,
  liabilities,
  equity,
  ratios,
}: BalanceSheetProps) {
  const totalCurrentAssets = sumItems(assets.current);
  const totalNonCurrentAssets = sumItems(assets.nonCurrent);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = sumItems(liabilities.current);
  const totalNonCurrentLiabilities = sumItems(liabilities.nonCurrent);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const totalEquity = sumItems(equity.items);

  const fmt = (amount: number) =>
    formatAmount({ amount: Math.abs(amount), currency, locale });

  return (
    <div className="space-y-6">
      {/* Balance Sheet Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[16px] font-medium text-black dark:text-white">
            Balance Sheet
          </h4>
          <div className="text-[12px] text-[#707070] dark:text-[#666]">
            As of {asOf}
          </div>
        </div>

        <div className="border bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] overflow-hidden">
          {/* Assets header */}
          <div className="flex border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-[#707070] dark:text-[#666]">
              ASSETS
            </div>
            <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-right text-[#707070] dark:text-[#666]">
              Amount
            </div>
          </div>

          {/* Current Assets */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <SectionHeader label="Current Assets" />
            {assets.current
              .filter((i) => i.amount !== 0)
              .map((item) => (
                <RowItem
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  currency={currency}
                  locale={locale}
                />
              ))}
            <SubtotalRow
              label="Total Current Assets"
              amount={totalCurrentAssets}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Non-Current Assets */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <SectionHeader label="Non-Current Assets" />
            {assets.nonCurrent
              .filter((i) => i.amount !== 0)
              .map((item) => (
                <RowItem
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  currency={currency}
                  locale={locale}
                />
              ))}
            <SubtotalRow
              label="Total Non-Current Assets"
              amount={totalNonCurrentAssets}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Total Assets */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <TotalRow
              label="Total Assets"
              amount={totalAssets}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Liabilities & Equity header */}
          <div className="flex border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-[#707070] dark:text-[#666]">
              LIABILITIES & EQUITY
            </div>
            <div className="w-1/2 px-4 py-3 text-[12px] font-medium text-right text-[#707070] dark:text-[#666]">
              Amount
            </div>
          </div>

          {/* Current Liabilities */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <SectionHeader label="Current Liabilities" />
            {liabilities.current
              .filter((i) => i.amount !== 0)
              .map((item) => (
                <RowItem
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  currency={currency}
                  locale={locale}
                />
              ))}
            <SubtotalRow
              label="Total Current Liabilities"
              amount={totalCurrentLiabilities}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Non-Current Liabilities */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <SectionHeader label="Non-Current Liabilities" />
            {liabilities.nonCurrent
              .filter((i) => i.amount !== 0)
              .map((item) => (
                <RowItem
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  currency={currency}
                  locale={locale}
                />
              ))}
            <SubtotalRow
              label="Total Non-Current Liabilities"
              amount={totalNonCurrentLiabilities}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Total Liabilities */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <TotalRow
              label="Total Liabilities"
              amount={totalLiabilities}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Equity */}
          <div className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            <SectionHeader label="Equity" />
            {equity.items
              .filter((i) => i.amount !== 0)
              .map((item) => (
                <RowItem
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  currency={currency}
                  locale={locale}
                />
              ))}
            <SubtotalRow
              label="Total Equity"
              amount={totalEquity}
              currency={currency}
              locale={locale}
            />
          </div>

          {/* Total Liabilities & Equity */}
          <TotalRow
            label="Total Liabilities & Equity"
            amount={totalLiabilities + totalEquity}
            currency={currency}
            locale={locale}
          />
        </div>
      </div>

      {/* Financial Ratios */}
      {ratios && (
        <div className="grid grid-cols-2 gap-3">
          {ratios.currentRatio != null && (
            <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
              <div className="text-[12px] mb-1 text-[#707070] dark:text-[#666]">
                Current Ratio
              </div>
              <div className="text-[18px] font-mono text-black dark:text-white mb-1">
                {ratios.currentRatio.toFixed(2)}:1
              </div>
              <div className="text-[10px] text-[#707070] dark:text-[#666]">
                {getRatioSubtitle(
                  "currentRatio",
                  ratios.currentRatio,
                  undefined,
                  totalCurrentLiabilities,
                )}
              </div>
            </div>
          )}
          {ratios.debtToEquity != null && (
            <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
              <div className="text-[12px] mb-1 text-[#707070] dark:text-[#666]">
                Debt-to-Equity
              </div>
              <div className="text-[18px] font-mono text-black dark:text-white mb-1">
                {ratios.debtToEquity.toFixed(2)}:1
              </div>
              <div className="text-[10px] text-[#707070] dark:text-[#666]">
                {getRatioSubtitle(
                  "debtToEquity",
                  ratios.debtToEquity,
                  totalLiabilities,
                )}
              </div>
            </div>
          )}
          {ratios.workingCapital != null && (
            <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
              <div className="text-[12px] mb-1 text-[#707070] dark:text-[#666]">
                Working Capital
              </div>
              <div className="text-[18px] font-mono text-black dark:text-white mb-1">
                {fmt(ratios.workingCapital)}
              </div>
              <div className="text-[10px] text-[#707070] dark:text-[#666]">
                Current assets - current liabilities
              </div>
            </div>
          )}
          {ratios.equityRatio != null && (
            <div className="border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d]">
              <div className="text-[12px] mb-1 text-[#707070] dark:text-[#666]">
                Equity Ratio
              </div>
              <div className="text-[18px] font-mono text-black dark:text-white mb-1">
                {ratios.equityRatio.toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#707070] dark:text-[#666]">
                {getRatioSubtitle("equityRatio", ratios.equityRatio)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
