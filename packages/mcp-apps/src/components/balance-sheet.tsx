import { formatAmount } from "../utils/format-amount";

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

const cellStyle = { padding: "8px 16px", fontSize: 12 };
const headerBg = "var(--bg-subtle)";
const borderStyle = "1px solid var(--border-color)";

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
    <div
      style={{ ...cellStyle, display: "flex", justifyContent: "space-between" }}
    >
      <div style={{ paddingLeft: 16, color: "var(--text-muted)" }}>{label}</div>
      <div
        style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
      >
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
    <div
      style={{
        ...cellStyle,
        display: "flex",
        justifyContent: "space-between",
        borderTop: borderStyle,
        background: headerBg,
        fontWeight: 500,
      }}
    >
      <div style={{ color: "var(--text-primary)" }}>{label}</div>
      <div
        style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
      >
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
    <div
      style={{
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        background: headerBg,
        fontWeight: 500,
        fontSize: 14,
      }}
    >
      <div style={{ color: "var(--text-primary)" }}>{label}</div>
      <div
        style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
      >
        {amount < 0 ? `(${formatted})` : formatted}
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        ...cellStyle,
        background: headerBg,
        fontWeight: 500,
        color: "var(--text-primary)",
      }}
    >
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
  const fmt = (amount: number) =>
    formatAmount({ amount: Math.abs(amount), currency, locale });
  const sectionBorder = { borderBottom: borderStyle };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h4
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Balance Sheet
        </h4>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          As of {asOf}
        </div>
      </div>

      <div
        style={{
          border: borderStyle,
          background: "var(--bg-card)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", ...sectionBorder }}>
          <div
            style={{
              width: "50%",
              ...cellStyle,
              fontWeight: 500,
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            ASSETS
          </div>
          <div
            style={{
              width: "50%",
              ...cellStyle,
              fontWeight: 500,
              color: "var(--text-muted)",
              textAlign: "right",
              fontSize: 12,
            }}
          >
            Amount
          </div>
        </div>

        <div style={sectionBorder}>
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

        <div style={sectionBorder}>
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

        <div style={sectionBorder}>
          <TotalRow
            label="Total Assets"
            amount={totalAssets}
            currency={currency}
            locale={locale}
          />
        </div>

        <div style={{ display: "flex", ...sectionBorder }}>
          <div
            style={{
              width: "50%",
              ...cellStyle,
              fontWeight: 500,
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            LIABILITIES & EQUITY
          </div>
          <div
            style={{
              width: "50%",
              ...cellStyle,
              fontWeight: 500,
              color: "var(--text-muted)",
              textAlign: "right",
              fontSize: 12,
            }}
          >
            Amount
          </div>
        </div>

        <div style={sectionBorder}>
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

        <div style={sectionBorder}>
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

        <div style={sectionBorder}>
          <TotalRow
            label="Total Liabilities"
            amount={totalLiabilities}
            currency={currency}
            locale={locale}
          />
        </div>

        <div style={sectionBorder}>
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

        <TotalRow
          label="Total Liabilities & Equity"
          amount={totalLiabilities + totalEquity}
          currency={currency}
          locale={locale}
        />
      </div>

      {ratios && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginTop: 24,
          }}
        >
          {ratios.currentRatio != null && (
            <div
              style={{
                border: borderStyle,
                padding: 12,
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                  color: "var(--text-muted)",
                }}
              >
                Current Ratio
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {ratios.currentRatio.toFixed(2)}:1
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
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
            <div
              style={{
                border: borderStyle,
                padding: 12,
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                  color: "var(--text-muted)",
                }}
              >
                Debt-to-Equity
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {ratios.debtToEquity.toFixed(2)}:1
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {getRatioSubtitle(
                  "debtToEquity",
                  ratios.debtToEquity,
                  totalLiabilities,
                )}
              </div>
            </div>
          )}
          {ratios.workingCapital != null && (
            <div
              style={{
                border: borderStyle,
                padding: 12,
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                  color: "var(--text-muted)",
                }}
              >
                Working Capital
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {fmt(ratios.workingCapital)}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Current assets - current liabilities
              </div>
            </div>
          )}
          {ratios.equityRatio != null && (
            <div
              style={{
                border: borderStyle,
                padding: 12,
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                  color: "var(--text-muted)",
                }}
              >
                Equity Ratio
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {ratios.equityRatio.toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {getRatioSubtitle("equityRatio", ratios.equityRatio)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
