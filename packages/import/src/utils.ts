import { addDays, isValid, parse, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

function getAdjustedDate(date: string, dateAdjustment?: number) {
  const adjustedDate = dateAdjustment
    ? dateAdjustment > 0
      ? addDays(date, Math.abs(dateAdjustment)).toISOString()
      : subDays(date, Math.abs(dateAdjustment)).toISOString()
    : date;

  return adjustedDate;
}

function ensureValidYear(dateString: string | undefined): string | undefined {
  if (!dateString) return undefined;

  const [year, month, day] = dateString.split("-");
  const correctedYear =
    year?.length === 4
      ? year.startsWith("20")
        ? year
        : `20${year.slice(2)}`
      : `20${year}`;

  return `${correctedYear}-${month}-${day}`;
}

export function formatDate(
  date: string,
  timezone = "America/New_York",
  dateAdjustment?: number,
) {
  const formats = [
    "dd/MM/yyyy",
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "dd.MM.yyyy",
    "dd-MM-yyyy",
    "yyyy/MM/dd",
    "MM-dd-yyyy",
    "yyyy.MM.dd",
    "dd MMM yyyy",
    "MMM dd, yyyy",
    "MMMM dd, yyyy",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd HH:mm:ss",
    "dd/MM/yyyy HH:mm:ss",
    "MM/dd/yyyy HH:mm:ss",
    "yyyy/MM/dd HH:mm:ss",
    "dd.MM.yyyy HH:mm:ss",
    "dd-MM-yyyy HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
    "yyyy-MM-dd'T'HH:mm:ss",
    "d/M/yy",
  ];

  for (const format of formats) {
    const parsedDate = parse(date, format, new Date());
    if (isValid(parsedDate)) {
      const formattedDate = formatInTimeZone(
        parsedDate,
        timezone,
        "yyyy-MM-dd",
      );
      return ensureValidYear(getAdjustedDate(formattedDate, dateAdjustment));
    }
  }

  if (isValid(new Date(date))) {
    return ensureValidYear(
      formatInTimeZone(new Date(date), timezone, "yyyy-MM-dd"),
    );
  }

  // If the date includes a time, we don't need to remove the time.
  const value = date.includes("T") ? date : date.replace(/[^0-9-\.\/]/g, "");

  if (isValid(new Date(value))) {
    const formattedDate = formatInTimeZone(
      new Date(value),
      timezone,
      "yyyy-MM-dd",
    );
    return ensureValidYear(getAdjustedDate(formattedDate, dateAdjustment));
  }

  // If all parsing attempts fail, return undefined
  return undefined;
}

export function formatAmountValue({
  amount,
  inverted,
}: { amount: string; inverted?: boolean }) {
  let value: number;

  // Handle special minus sign (−) by replacing with standard minus (-)
  const normalizedAmount = amount.replace(/−/g, "-");

  if (normalizedAmount.includes(",")) {
    // Remove thousands separators and replace the comma with a period.
    value = +normalizedAmount.replace(/\./g, "").replace(",", ".");
  } else if (normalizedAmount.match(/\.\d{2}$/)) {
    // If it ends with .XX, it's likely a decimal; remove internal periods.
    value = +normalizedAmount.replace(/\.(?=\d{3})/g, "");
  } else {
    // If neither condition is met, convert the amount directly to a number
    value = +normalizedAmount;
  }

  if (inverted) {
    return +(value * -1);
  }

  return value;
}
