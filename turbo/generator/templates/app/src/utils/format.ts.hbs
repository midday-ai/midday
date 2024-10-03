import { format, isSameYear } from "date-fns";

/**
 * Formats a file size in bytes to a human-readable string.
 * @param bytes - The size in bytes to format.
 * @returns A formatted string representing the file size with appropriate units.
 * @example
 * formatSize(1024) // returns "1 kilobyte"
 * formatSize(1048576) // returns "1 megabyte"
 */
export function formatSize(bytes: number): string {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
  const unitIndex = Math.max(
    0,
    Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  );
  return Intl.NumberFormat("en-US", {
    style: "unit",
    unit: units[unitIndex],
  }).format(+Math.round(bytes / 1024 ** unitIndex));
}

type FormatAmountParams = {
  currency: string;
  amount: number;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

/**
 * Formats an amount of money in a specific currency.
 * @param params - The parameters for formatting the amount.
 * @param params.currency - The currency code (e.g., "USD", "EUR").
 * @param params.amount - The amount to format.
 * @param params.locale - The locale to use for formatting (default: "en-US").
 * @param params.minimumFractionDigits - The minimum number of fraction digits to use.
 * @param params.maximumFractionDigits - The maximum number of fraction digits to use.
 * @returns A formatted string representing the monetary amount, or undefined if no currency is provided.
 * @example
 * formatAmount({ currency: "USD", amount: 1234.56 }) // returns "$1,234.56"
 */
export function formatAmount({
  currency,
  amount,
  locale = "en-US",
  minimumFractionDigits,
  maximumFractionDigits,
}: FormatAmountParams) {
  if (!currency) {
    return;
  }
  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Converts a number of seconds to a string representation of hours or minutes.
 * @param seconds - The number of seconds to convert.
 * @returns A string representing the time in hours or minutes.
 * @example
 * secondsToHoursAndMinutes(3600) // returns "1h"
 * secondsToHoursAndMinutes(300) // returns "5m"
 */
export function secondsToHoursAndMinutes(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) {
    return `${hours}h`;
  }
  if (minutes) {
    return `${minutes}m`;
  }
  return "0h";
}

type BurnRateData = {
  value: number;
  date: string;
};

/**
 * Calculates the average burn rate from an array of burn rate data.
 * @param data - An array of burn rate data objects, or null.
 * @returns The average burn rate, or 0 if the input is null or empty.
 */
export function calculateAvgBurnRate(data: BurnRateData[] | null) {
  if (!data) {
    return 0;
  }
  return data?.reduce((acc, curr) => acc + curr.value, 0) / data?.length;
}

/**
 * Formats a transaction date string.
 * @param date - The date string to format.
 * @returns A formatted date string. If the date is in the current year, it returns "MMM d" format,
 * otherwise, it returns the date in "P" format (locale-specific).
 */
export function formatTransactionDate(date: string) {
  if (isSameYear(new Date(), new Date(date))) {
    return format(new Date(date), "MMM d");
  }
  return format(new Date(date), "P");
}

export function getInitials(value: string) {
  const formatted = value.toUpperCase().replace(/[\s.-]/g, "");
  if (formatted.split(" ").length > 1) {
    return `${formatted.charAt(0)}${formatted.charAt(1)}`;
  }
  if (value.length > 1) {
    return formatted.charAt(0) + formatted.charAt(1);
  }
  return formatted.charAt(0);
}

export function formatAccountName({
  name,
  currency,
}: {
  name?: string;
  currency?: string;
}) {
  if (currency) {
    return `${name} (${currency})`;
  }
  return name;
}

/**
 * Formats a number as a percentage string
 * @param value - The number to format as a percentage
 * @param locale - The locale to use for formatting
 * @param options - Additional Intl.NumberFormat options
 * @returns A formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}
