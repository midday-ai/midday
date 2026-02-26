import { cn } from "@midday/ui/cn";

export type DealStatus =
  | "active"
  | "paid_off"
  | "defaulted"
  | "paused"
  | "late"
  | "in_collections";

const statusStyles: Record<DealStatus, string> = {
  active: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  paid_off: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  defaulted: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  paused: "text-[#FFD02B] bg-[#FFD02B]/10 dark:bg-[#FFD02B]/10",
  late: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  in_collections: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
};

export const statusLabels: Record<DealStatus, string> = {
  active: "Active",
  paid_off: "Paid Off",
  defaulted: "Default",
  paused: "Paused",
  late: "Late",
  in_collections: "Collections",
};

export function DealStatusBadge({
  status,
  className,
}: { status: DealStatus | null; className?: string }) {
  const safeStatus = (status || "active") as DealStatus;
  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[safeStatus] || statusStyles.active,
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {statusLabels[safeStatus] || "Active"}
      </span>
    </div>
  );
}
