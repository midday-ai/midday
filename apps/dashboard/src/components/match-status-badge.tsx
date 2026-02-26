import { cn } from "@midday/ui/cn";

export type MatchStatus =
  | "unmatched"
  | "auto_matched"
  | "suggested"
  | "manual_matched"
  | "flagged"
  | "excluded";

const statusStyles: Record<MatchStatus, string> = {
  unmatched:
    "text-[#878787] bg-[#878787]/10 dark:text-[#F5F5F3] dark:bg-[#F5F5F3]/10",
  auto_matched: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  suggested: "text-[#FFD02B] bg-[#FFD02B]/10 dark:bg-[#FFD02B]/10",
  manual_matched: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  flagged: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  excluded:
    "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
};

const statusLabels: Record<MatchStatus, string> = {
  unmatched: "Unmatched",
  auto_matched: "Auto-Matched",
  suggested: "Suggested",
  manual_matched: "Manual Match",
  flagged: "Flagged",
  excluded: "Excluded",
};

type Props = {
  status: string | null | undefined;
  className?: string;
};

export function MatchStatusBadge({ status, className }: Props) {
  if (!status || !(status in statusStyles)) {
    return <span className="text-[#878787] text-xs">-</span>;
  }

  const safeStatus = status as MatchStatus;

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
        statusStyles[safeStatus],
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {statusLabels[safeStatus]}
      </span>
    </div>
  );
}
