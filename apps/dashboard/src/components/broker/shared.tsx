import { cn } from "@midday/ui/cn";

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
};

export function StatCard({ title, value, subtitle, className }: StatCardProps) {
  return (
    <div className="border border-border p-4">
      <p className="text-xs text-[#878787] font-normal">{title}</p>
      <p className={cn("text-2xl font-mono font-semibold mt-1", className)}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function DealStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    active: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
    paid_off: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
    defaulted: "text-[#FF3638] bg-[#FF3638]/10",
    paused: "text-[#FFD02B] bg-[#FFD02B]/10",
    late: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
    in_collections: "text-[#FF3638] bg-[#FF3638]/10",
  };

  const statusLabels: Record<string, string> = {
    active: "Active",
    paid_off: "Paid Off",
    defaulted: "Default",
    paused: "Paused",
    late: "Late",
    in_collections: "Collections",
  };

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[status] || "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {statusLabels[status] || status}
      </span>
    </div>
  );
}

export function CommissionStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    paid: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
    pending: "text-[#FFD02B] bg-[#FFD02B]/10",
    cancelled: "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
  };

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[status] || "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
      )}
    >
      <span className="line-clamp-1 truncate inline-block capitalize">
        {status}
      </span>
    </div>
  );
}

export function CommissionStatusLabel({ status }: { status: string }) {
  const color = status === "paid" ? "text-[#00C969]" : "text-[#FFD02B]";
  return <span className={cn("ml-1 text-[10px]", color)}>({status})</span>;
}

export function formatCurrency(
  value: string | number | null | undefined,
): string {
  return `$${Number(value ?? 0).toLocaleString()}`;
}
