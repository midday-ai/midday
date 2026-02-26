import { cn } from "@midday/ui/cn";

export type DisclosureDocStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed"
  | "superseded";

const statusStyles: Record<DisclosureDocStatus, string> = {
  pending: "text-[#FFD02B] bg-[#FFD02B]/10 dark:bg-[#FFD02B]/10",
  generating: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  completed: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  failed: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  superseded:
    "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
};

const statusLabels: Record<DisclosureDocStatus, string> = {
  pending: "Pending",
  generating: "Generating...",
  completed: "Completed",
  failed: "Failed",
  superseded: "Superseded",
};

export function DisclosureStatusBadge({
  status,
  className,
}: { status: DisclosureDocStatus | string | null; className?: string }) {
  const safeStatus = (status || "pending") as DisclosureDocStatus;
  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[safeStatus] || statusStyles.pending,
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {statusLabels[safeStatus] || status || "Pending"}
      </span>
    </div>
  );
}
