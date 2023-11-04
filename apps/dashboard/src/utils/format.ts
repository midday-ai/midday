export function getClientLocale() {
  return navigator.languages && navigator.languages.length >= 0
    ? navigator.languages[0]
    : "en-US";
}

export function formatSize(bytes: number): string {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
  const locale = getClientLocale();

  const unitIndex = Math.max(
    0,
    Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1),
  );

  return Intl.NumberFormat(locale, {
    style: "unit",
    unit: units[unitIndex],
  }).format(bytes / 1024 ** unitIndex);
}

type FormatAmountParams = {
  currency: string;
  amount: number;
  locale?: string;
};

export function formatAmount({
  currency,
  amount,
  locale = "en-US",
}: FormatAmountParams) {
  if (!currency) {
    return;
  }

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}
