import { formatISO } from "date-fns";

export function formatDate(date: string) {
  return formatISO(date, {
    representation: "date",
  });
}

export function formatAmountValue({
  amount,
  inverted,
}: { amount: string; inverted: boolean }) {
  const value = +amount.replaceAll(",", ".").replace(/[^\d.-]/g, "");

  if (inverted) {
    return +(value * -1);
  }

  return value;
}
