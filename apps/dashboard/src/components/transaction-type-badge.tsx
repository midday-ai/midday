import { cn } from "@midday/ui/cn";

const typeStyles: Record<string, string> = {
  credit: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  debit: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  refund: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  fee: "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
  adjustment: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  transfer: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
};

const typeLabels: Record<string, string> = {
  credit: "Credit",
  debit: "Debit",
  refund: "Refund",
  fee: "Fee",
  adjustment: "Adjustment",
  transfer: "Transfer",
};

type Props = {
  type: string | null | undefined;
  className?: string;
};

export function TransactionTypeBadge({ type, className }: Props) {
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
