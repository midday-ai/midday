import { formatISO, isValid } from "date-fns";

export function formatDate(date: string) {
  if (isValid(new Date(date))) {
    return formatISO(date, {
      representation: "date",
    });
  }

  // If the date includes a time, we don't need to remove the time.
  const value = date.includes("T") ? date : date.replace(/[^0-9-\.\/]/g, "");

  if (isValid(new Date(value))) {
    return formatISO(value, {
      representation: "date",
    });
  }
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
