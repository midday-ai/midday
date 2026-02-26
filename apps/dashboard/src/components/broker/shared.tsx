import { cn } from "@midday/ui/cn";

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
};

export function StatCard({ title, value, subtitle, className }: StatCardProps) {
  return (
    <div className="border border-border rounded-lg p-4">
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
  function getStatusStyles(s: string): string {
    switch (s) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      case "paid_off":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
      case "defaulted":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full",
        getStatusStyles(status),
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function CommissionStatusBadge({ status }: { status: string }) {
  function getStatusStyles(s: string): string {
    switch (s) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full",
        getStatusStyles(status),
      )}
    >
      {status}
    </span>
  );
}

export function CommissionStatusLabel({ status }: { status: string }) {
  const color = status === "paid" ? "text-green-600" : "text-amber-600";

  return <span className={cn("ml-1 text-[10px]", color)}>({status})</span>;
}

export function formatCurrency(
  value: string | number | null | undefined,
): string {
  return `$${Number(value ?? 0).toLocaleString()}`;
}
