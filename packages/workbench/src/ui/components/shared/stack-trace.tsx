import { Check, ChevronDown, Copy } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StackTraceProps {
  error?: string;
  stacktrace?: string[];
  className?: string;
}

export function StackTrace({ error, stacktrace, className }: StackTraceProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!error && (!stacktrace || stacktrace.length === 0)) {
    return null;
  }

  const fullText = [error, ...(stacktrace || [])].filter(Boolean).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn("border border-destructive/20 bg-destructive/5", className)}
    >
      {/* Error message header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-destructive break-words">
            {error || "Unknown error"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          {stacktrace && stacktrace.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Stack trace */}
      {expanded && stacktrace && stacktrace.length > 0 && (
        <div className="border-t border-destructive/20 p-4">
          <pre className="font-mono text-xs text-muted-foreground overflow-auto max-h-64 whitespace-pre-wrap">
            {stacktrace.map((line, i) => (
              <div
                key={i.toString()}
                className="hover:bg-destructive/10 px-1 -mx-1"
              >
                {formatStackLine(line)}
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function formatStackLine(line: string): React.ReactNode {
  // Highlight file paths and line numbers
  const fileMatch = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
  if (fileMatch) {
    const [, fnName, filePath, lineNum, colNum] = fileMatch;
    return (
      <>
        <span className="text-muted-foreground">at </span>
        <span className="text-foreground">{fnName}</span>
        <span className="text-muted-foreground"> (</span>
        <span className="text-primary">{filePath}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-warning">{lineNum}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-warning">{colNum}</span>
        <span className="text-muted-foreground">)</span>
      </>
    );
  }

  // Simple file path format
  const simpleMatch = line.match(/at (.+?):(\d+):(\d+)/);
  if (simpleMatch) {
    const [, filePath, lineNum, colNum] = simpleMatch;
    return (
      <>
        <span className="text-muted-foreground">at </span>
        <span className="text-primary">{filePath}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-warning">{lineNum}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-warning">{colNum}</span>
      </>
    );
  }

  return line;
}
