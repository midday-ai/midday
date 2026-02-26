import { cn } from "@midday/ui/cn";

const typeStyles: Record<string, string> = {
  contribution:
    "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  withdrawal:
    "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  profit_distribution:
    "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  deal_allocation:
    "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  fee: "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
  chargeback:
    "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  transfer:
    "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  refund:
    "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
};

const typeLabels: Record<string, string> = {
  contribution: "Contribution",
  withdrawal: "Withdrawal",
  profit_distribution: "Distribution",
  deal_allocation: "Allocation",
  fee: "Fee",
  chargeback: "Chargeback",
  transfer: "Transfer",
  refund: "Refund",
};

type Props = {
  type: string | null | undefined;
  className?: string;
};

export function SyndicationTransactionTypeBadge({ type, className }: Props) {
  if (!type || !(type in typeStyles)) {
    return <span className="text-[#878787] text-xs">-</span>;
  }

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        typeStyles[type],
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {typeLabels[type] || type}
      </span>
    </div>
  );
}
