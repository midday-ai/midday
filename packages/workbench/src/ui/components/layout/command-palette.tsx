import {
  ArrowRight,
  BarChart3,
  Calendar,
  FileText,
  FlaskConical,
  Layers,
  Moon,
  Network,
  RefreshCw,
  Search,
  Sun,
} from "lucide-react";
import * as React from "react";
import { parseSearchQuery } from "@/components/smart-search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useConfig, useSearch, useTagValues } from "@/lib/hooks";
import { formatRelativeTime, truncate } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queues: string[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectQueue: (queue: string) => void;
  onSelectJob: (queue: string, jobId: string) => void;
  onNavigate: (path: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  keywords: string[];
}

const navigationItems: NavigationItem[] = [
  {
    id: "runs",
    label: "Runs",
    path: "/",
    icon: <FileText className="h-4 w-4" />,
    keywords: ["runs", "jobs", "all"],
  },
  {
    id: "metrics",
    label: "Metrics",
    path: "/metrics",
    icon: <BarChart3 className="h-4 w-4" />,
    keywords: ["metrics", "stats", "analytics", "dashboard"],
  },
  {
    id: "schedulers",
    label: "Schedulers",
    path: "/schedulers",
    icon: <Calendar className="h-4 w-4" />,
    keywords: ["schedulers", "scheduled", "cron", "repeatable", "delayed"],
  },
  {
    id: "flows",
    label: "Flows",
    path: "/flows",
    icon: <Network className="h-4 w-4" />,
    keywords: ["flows", "workflows", "graph"],
  },
  {
    id: "test",
    label: "Test",
    path: "/test",
    icon: <FlaskConical className="h-4 w-4" />,
    keywords: ["test", "testing", "try"],
  },
];

export function CommandPalette({
  open,
  onOpenChange,
  queues,
  searchQuery,
  onSearchQueryChange,
  isDark,
  onToggleTheme,
  onSelectQueue,
  onSelectJob,
  onNavigate,
}: CommandPaletteProps) {
  const { data: config } = useConfig();
  const [inputValue, setInputValue] = React.useState(searchQuery);
  const tagFields = config?.tags ?? [];

  // Sync input value with searchQuery prop and when dialog opens
  React.useEffect(() => {
    if (open) {
      setInputValue(searchQuery);
    }
  }, [open, searchQuery]);

  // Sync input changes to parent
  const handleInputChange = (value: string) => {
    setInputValue(value);
    onSearchQueryChange(value);
  };

  // Parse search query for tag autocomplete
  const _parsedQuery = React.useMemo(() => {
    return parseSearchQuery(inputValue);
  }, [inputValue]);

  // Determine if we're typing a tag value
  const { currentToken, tokenType, tokenPrefix } = React.useMemo(() => {
    const cursorPos = inputValue.length; // Command palette doesn't expose cursor position
    const beforeCursor = inputValue.slice(0, cursorPos);
    const lastSpaceIndex = beforeCursor.lastIndexOf(" ");
    const currentToken = beforeCursor.slice(lastSpaceIndex + 1);
    const colonIndex = currentToken.indexOf(":");
    if (colonIndex > 0) {
      const key = currentToken.slice(0, colonIndex);
      const valuePrefix = currentToken.slice(colonIndex + 1);
      return {
        currentToken,
        tokenType: "value" as const,
        tokenPrefix: { key, valuePrefix },
      };
    }
    return {
      currentToken,
      tokenType: "key" as const,
      tokenPrefix: null,
    };
  }, [inputValue]);

  // Get tag values for autocomplete
  const activeTagField = tokenType === "value" ? tokenPrefix?.key : undefined;
  const { data: tagValuesData } = useTagValues(
    activeTagField ?? "",
    !!activeTagField && tagFields.includes(activeTagField ?? ""),
  );
  const tagValues = tagValuesData?.values ?? [];

  // Search jobs
  const { data: searchData, isLoading: isSearching } = useSearch(inputValue);
  const jobResults = searchData?.results ?? [];

  // Filter navigation items by query
  const filteredNavigation = React.useMemo(() => {
    if (!inputValue.trim()) return navigationItems;
    const query = inputValue.toLowerCase();
    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(query)),
    );
  }, [inputValue]);

  // Filter queues by query
  const filteredQueues = React.useMemo(() => {
    if (!inputValue.trim()) return queues;
    const query = inputValue.toLowerCase();
    return queues.filter((q) => q.toLowerCase().includes(query));
  }, [inputValue, queues]);

  // Check if query matches a tag key
  const matchingTagKeys = React.useMemo(() => {
    if (tokenType !== "key" || !currentToken) return [];
    return tagFields.filter((field) =>
      field.toLowerCase().startsWith(currentToken.toLowerCase()),
    );
  }, [tokenType, currentToken, tagFields]);

  // Filter tag values by prefix
  const filteredTagValues = React.useMemo(() => {
    if (tokenType !== "value" || !tokenPrefix) return [];
    const prefix = tokenPrefix.valuePrefix.toLowerCase();
    return tagValues
      .filter((tv) => tv.value.toLowerCase().startsWith(prefix))
      .slice(0, 10);
  }, [tokenType, tokenPrefix, tagValues]);

  const _hasResults =
    filteredNavigation.length > 0 ||
    filteredQueues.length > 0 ||
    jobResults.length > 0 ||
    matchingTagKeys.length > 0 ||
    filteredTagValues.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search jobs, queues, tags, or navigate..."
        value={inputValue}
        onValueChange={handleInputChange}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Tag key suggestions */}
        {matchingTagKeys.length > 0 && (
          <CommandGroup heading="Tag Fields">
            {matchingTagKeys.map((key) => (
              <CommandItem
                key={key}
                value={`tag-key-${key}`}
                onSelect={() => {
                  const newValue = inputValue.replace(currentToken, `${key}:`);
                  handleInputChange(newValue);
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="font-mono">{key}:</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  tag field
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Tag value suggestions */}
        {filteredTagValues.length > 0 && (
          <CommandGroup heading={`${tokenPrefix?.key} values`}>
            {filteredTagValues.map((tv) => {
              const fullValue = `${tokenPrefix?.key}:${tv.value}`;
              return (
                <CommandItem
                  key={tv.value}
                  value={`tag-value-${tv.value}`}
                  onSelect={() => {
                    const beforeColon = inputValue.slice(
                      0,
                      inputValue.lastIndexOf(currentToken),
                    );
                    const newValue = `${beforeColon}${fullValue} `.trim();
                    handleInputChange(newValue);
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span className="font-mono">{fullValue}</span>
                  {tv.count > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {tv.count} jobs
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Navigation items */}
        {filteredNavigation.length > 0 && (
          <CommandGroup heading="Navigation">
            {filteredNavigation.map((item) => (
              <CommandItem
                key={item.id}
                value={`nav-${item.id}`}
                onSelect={() => {
                  onNavigate(item.path);
                  onOpenChange(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Queues */}
        {filteredQueues.length > 0 && (
          <CommandGroup heading="Queues">
            {filteredQueues.map((queue) => (
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

        {/* Job search results */}
        {jobResults.length > 0 && (
          <CommandGroup heading={`Jobs (${jobResults.length})`}>
            {jobResults.map((result) => (
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

        {/* Quick actions */}
        {!inputValue.trim() && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem
                value="refresh"
                onSelect={() => {
                  window.location.reload();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh</span>
                <kbd className="ml-auto pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>R
                </kbd>
              </CommandItem>
              <CommandItem
                value="theme"
                onSelect={() => {
                  onToggleTheme();
                }}
              >
                {isDark ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>Toggle Theme</span>
                <kbd className="ml-auto pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>⇧T
                </kbd>
              </CommandItem>
            </CommandGroup>
          </>
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
