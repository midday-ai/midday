import { cn } from "@midday/ui/utils";

export function NumberFormat({ amount, currency, className }) {
  if (!amount || !currency) {
    return null;
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

  return (
    <span className={cn("text-sm font-medium", className)}>
      {formattedAmount}
    </span>
  );
}
