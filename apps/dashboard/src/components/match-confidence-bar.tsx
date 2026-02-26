import { cn } from "@midday/ui/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";

type Props = {
  confidence: number | null | undefined;
  className?: string;
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "bg-emerald-500";
  if (confidence >= 0.7) return "bg-amber-500";
  if (confidence >= 0.5) return "bg-orange-500";
  return "bg-gray-300";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.7) return "Medium";
  if (confidence >= 0.5) return "Low";
  return "None";
}

export function MatchConfidenceBar({ confidence, className }: Props) {
  if (confidence == null || confidence <= 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const pct = Math.round(confidence * 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-2 min-w-[80px]", className)}>
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                getConfidenceColor(confidence),
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
            {pct}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {getConfidenceLabel(confidence)} confidence ({pct}%)
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
