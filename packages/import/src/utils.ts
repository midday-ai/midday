import { formatISO } from "date-fns";

export function formatDate(date: string) {
  return formatISO(date, {
    representation: "date",
  });
}

export function formatAmountValue(amount: string) {
  return +amount.replaceAll(",", ".").replace(/[^\d.-]/g, "");
}
