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

export interface BalanceSheetProps {
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
  return (
    <div className="px-4 py-2 text-xs flex justify-between">
      <div className="pl-4 text-muted-foreground">{label}</div>
      <div className="font-mono text-foreground">
        {amount < 0 ? `(${formatted})` : formatted}
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
  return (
    <div className="px-4 py-2 text-xs flex justify-between border-t border-border bg-accent font-medium">
      <div className="text-foreground">{label}</div>
      <div className="font-mono text-foreground">
        {amount < 0 ? `(${formatted})` : formatted}
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
  return (
    <div className="px-4 py-3 flex justify-between bg-accent font-medium text-sm">
      <div className="text-foreground">{label}</div>
      <div className="font-mono text-foreground">
        {amount < 0 ? `(${formatted})` : formatted}
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 text-xs bg-accent font-medium text-foreground">
      {label}
    </div>
  );
}

function sumItems(items: BalanceSheetLineItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function getRatioSubtitle(
  type: string,
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
  const fmt = (amount: number) => {
    const formatted = formatAmount({
      amount: Math.abs(amount),
      currency,
      locale,
    });
    return amount < 0 ? `(${formatted})` : formatted;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-foreground m-0">
          Balance Sheet
        </h4>
        <div className="text-xs text-muted-foreground">As of {asOf}</div>
      </div>

      <div className="border border-border bg-card overflow-hidden">
        {/* Assets header */}
        <div className="flex border-b border-border">
          <div className="w-1/2 px-4 py-2 text-xs font-medium text-muted-foreground">
            ASSETS
          </div>
          <div className="w-1/2 px-4 py-2 text-xs font-medium text-muted-foreground text-right">
            Amount
          </div>
        </div>

        {/* Current Assets */}
        <div className="border-b border-border">
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
        <div className="border-b border-border">
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
        <div className="border-b border-border">
          <TotalRow
            label="Total Assets"
            amount={totalAssets}
            currency={currency}
            locale={locale}
          />
        </div>

        {/* Liabilities & Equity header */}
        <div className="flex border-b border-border">
          <div className="w-1/2 px-4 py-2 text-xs font-medium text-muted-foreground">
            LIABILITIES & EQUITY
          </div>
          <div className="w-1/2 px-4 py-2 text-xs font-medium text-muted-foreground text-right">
            Amount
          </div>
        </div>

        {/* Current Liabilities */}
        <div className="border-b border-border">
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
        <div className="border-b border-border">
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
        <div className="border-b border-border">
          <TotalRow
            label="Total Liabilities"
            amount={totalLiabilities}
            currency={currency}
            locale={locale}
          />
        </div>

        {/* Equity */}
        <div className="border-b border-border">
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

      {ratios && (
        <div className="grid grid-cols-2 gap-3 mt-6">
          {ratios.currentRatio != null && (
            <div className="border border-border p-3 bg-card">
              <div className="text-xs mb-1 text-muted-foreground">
                Current Ratio
              </div>
              <div className="text-lg font-mono text-foreground mb-1">
                {ratios.currentRatio.toFixed(2)}:1
              </div>
              <div className="text-[10px] text-muted-foreground">
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
            <div className="border border-border p-3 bg-card">
              <div className="text-xs mb-1 text-muted-foreground">
                Debt-to-Equity
              </div>
              <div className="text-lg font-mono text-foreground mb-1">
                {ratios.debtToEquity.toFixed(2)}:1
              </div>
              <div className="text-[10px] text-muted-foreground">
                {getRatioSubtitle(
                  "debtToEquity",
                  ratios.debtToEquity,
                  totalLiabilities,
                )}
              </div>
            </div>
          )}
          {ratios.workingCapital != null && (
            <div className="border border-border p-3 bg-card">
              <div className="text-xs mb-1 text-muted-foreground">
                Working Capital
              </div>
              <div className="text-lg font-mono text-foreground mb-1">
                {fmt(ratios.workingCapital)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Current assets - current liabilities
              </div>
            </div>
          )}
          {ratios.equityRatio != null && (
            <div className="border border-border p-3 bg-card">
              <div className="text-xs mb-1 text-muted-foreground">
                Equity Ratio
              </div>
              <div className="text-lg font-mono text-foreground mb-1">
                {ratios.equityRatio.toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                {getRatioSubtitle("equityRatio", ratios.equityRatio)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
