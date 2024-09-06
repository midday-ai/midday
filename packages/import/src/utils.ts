import { formatISO, isValid, parse } from "date-fns";

export function formatDate(date: string) {
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
  ];

  for (const format of formats) {
    const parsedDate = parse(date, format, new Date());
    if (isValid(parsedDate)) {
      return formatISO(parsedDate, { representation: "date" });
    }
  }

  if (isValid(new Date(date))) {
    return formatISO(new Date(date), { representation: "date" });
  }

  // If the date includes a time, we don't need to remove the time.
  const value = date.includes("T") ? date : date.replace(/[^0-9-\.\/]/g, "");

  if (isValid(new Date(value))) {
    return formatISO(new Date(value), { representation: "date" });
  }

  // If all parsing attempts fail, return undefined
  return undefined;
}

export function formatAmountValue({
  amount,
  inverted,
}: { amount: string; inverted?: boolean }) {
  let value: number;

  if (amount.includes(",")) {
    // Remove thousands separators and replace the comma with a period.
    value = +amount.replace(/\./g, "").replace(",", ".");
  } else if (amount.match(/\.\d{2}$/)) {
    // If it ends with .XX, it's likely a decimal; remove internal periods.
    value = +amount.replace(/\.(?=\d{3})/g, "");
  } else {
    // If neither condition is met, convert the amount directly to a number
    value = +amount;
  }

  if (inverted) {
    return +(value * -1);
  }

  return value;
}
