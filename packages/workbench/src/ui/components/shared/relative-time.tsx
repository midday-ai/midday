import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  timestamp: number;
  className?: string;
}

export function RelativeTime({ timestamp, className }: RelativeTimeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{formatRelativeTime(timestamp)}</span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-mono text-xs">
          {formatAbsoluteTime(timestamp)}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
