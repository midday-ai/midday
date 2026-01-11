import { FileText, Layers } from "lucide-react";
import * as React from "react";
import { useSearch } from "@/lib/hooks";
import { formatRelativeTime, truncate } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queues: string[];
  onSelectQueue: (queue: string) => void;
  onSelectJob: (queue: string, jobId: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  queues,
  onSelectQueue,
  onSelectJob,
}: CommandPaletteProps) {
  const [inputValue, setInputValue] = React.useState("");
  const { data, isLoading } = useSearch(inputValue);
  const results = data?.results ?? [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search jobs (e.g., teamId:abc-123)..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Quick navigation to queues */}
        {!inputValue && (
          <CommandGroup heading="Queues">
            {queues.map((queue) => (
              <CommandItem
                key={queue}
                value={`queue-${queue}`}
                onSelect={() => {
                  onSelectQueue(queue);
                  onOpenChange(false);
                }}
              >
                <Layers className="mr-2 h-4 w-4" />
                <span className="font-mono">{queue}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search results */}
        {results.length > 0 && (
          <CommandGroup heading="Jobs">
            {results.map((result) => (
              <CommandItem
                key={`${result.queue}-${result.job.id}`}
                value={`job-${result.job.id}`}
                onSelect={() => {
                  onSelectJob(result.queue, result.job.id);
                  onOpenChange(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.job.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(result.job.timestamp)}
                    </span>
                  </div>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {truncate(result.job.id, 30)} · {result.queue}
                  </span>
                </div>
                <StatusDot status={result.job.status} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-success",
    active: "bg-warning",
    waiting: "bg-muted-foreground",
    delayed: "bg-muted-foreground",
    failed: "bg-destructive",
  };

  return (
    <span
      className={`h-2 w-2 rounded-full ${colors[status] || "bg-muted-foreground"}`}
    />
  );
}
