import { isValid, parse, parseISO } from "date-fns";

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

export function formatDate(date: string) {
  const formats = [
    "dd/MMM/yyyy",
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
      return ensureValidYear(parsedDate.toISOString().split("T")[0]);
    }
  }

  try {
    const parsedDate = parseISO(date);
    if (isValid(parsedDate)) {
      return ensureValidYear(parsedDate.toISOString().split("T")[0]);
    }
  } catch {
    // Continue if parseISO fails
  }

  // If the date includes a time, we don't need to remove the time.
  const value = date.includes("T") ? date : date.replace(/[^0-9-\.\/]/g, "");

  try {
    const parsedDate = parseISO(value);
    if (isValid(parsedDate)) {
      return ensureValidYear(parsedDate.toISOString().split("T")[0]);
    }
  } catch {
    // Continue if parseISO fails
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
