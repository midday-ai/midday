import { Search, X } from "lucide-react";
import * as React from "react";
import { useConfig, useTagValues } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface ParsedFilters {
  status?: string;
  tags: Record<string, string>;
  text: string;
}

interface SmartSearchProps {
  value: string;
  status?: string;
  onChange: (value: string, status?: string) => void;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "waiting", label: "Queued" },
  { value: "delayed", label: "Delayed" },
];

/**
 * Parse a search query into structured filters
 * e.g., "teamId:abc-123 invoice" -> { tags: { teamId: "abc-123" }, text: "invoice" }
 */
export function parseSearchQuery(query: string): ParsedFilters {
  const tags: Record<string, string> = {};
  const textParts: string[] = [];

  // Match key:value patterns (supporting quoted values)
  const regex = /(\w+):(?:"([^"]+)"|(\S+))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = regex.exec(query);
    if (!match) break;
    // Add any text before this match
    if (match.index > lastIndex) {
      const beforeText = query.slice(lastIndex, match.index).trim();
      if (beforeText) textParts.push(beforeText);
    }

    const key = match[1];
    const value = match[2] || match[3]; // quoted or unquoted

    // Handle status separately
    if (key === "status") {
      // Status is handled via the status prop, not in tags
    } else {
      tags[key] = value;
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < query.length) {
    const afterText = query.slice(lastIndex).trim();
    if (afterText) textParts.push(afterText);
  }

  return {
    tags,
    text: textParts.join(" "),
  };
}

/**
 * Build a search query string from structured filters
 */
export function buildSearchQuery(filters: ParsedFilters): string {
  const parts: string[] = [];

  // Add tag filters
  for (const [key, value] of Object.entries(filters.tags)) {
    if (value) {
      // Quote values with spaces
      const quotedValue = value.includes(" ") ? `"${value}"` : value;
      parts.push(`${key}:${quotedValue}`);
    }
  }

  // Add text search
  if (filters.text) {
    parts.push(filters.text);
  }

  return parts.join(" ");
}

export function SmartSearch({
  value,
  status,
  onChange,
  className,
}: SmartSearchProps) {
  const { data: config } = useConfig();
  const [inputValue, setInputValue] = React.useState(value);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const tagFields = config?.tags ?? [];

  const placeholder = "Search runs...";

  // Parse current input to determine what suggestions to show
  const { currentToken, tokenType, tokenPrefix } = React.useMemo(() => {
    const cursorPos = inputRef.current?.selectionStart ?? inputValue.length;
    const beforeCursor = inputValue.slice(0, cursorPos);

    // Find the current token being typed
    const lastSpaceIndex = beforeCursor.lastIndexOf(" ");
    const currentToken = beforeCursor.slice(lastSpaceIndex + 1);

    // Check if we're typing a key:value
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
    !!activeTagField,
  );
  const tagValues = tagValuesData?.values ?? [];

  // Generate suggestions based on current input
  const suggestions = React.useMemo(() => {
    const items: {
      type: "key" | "value" | "status";
      label: string;
      value: string;
    }[] = [];

    if (tokenType === "key" && currentToken) {
      const lowerToken = currentToken.toLowerCase();

      // Suggest tag prefixes
      for (const tag of tagFields) {
        if (tag.toLowerCase().startsWith(lowerToken)) {
          items.push({
            type: "key",
            label: `${tag}:`,
            value: `${tag}:`,
          });
        }
      }

      // Suggest status prefix
      if ("status".startsWith(lowerToken)) {
        items.push({
          type: "key",
          label: "status:",
          value: "status:",
        });
      }

      // Suggest status values directly
      for (const opt of STATUS_OPTIONS) {
        if (
          opt.value !== "all" &&
          (opt.value.toLowerCase().startsWith(lowerToken) ||
            opt.label.toLowerCase().startsWith(lowerToken))
        ) {
          items.push({
            type: "status",
            label: `status:${opt.value}`,
            value: `status:${opt.value}`,
          });
        }
      }
    } else if (tokenType === "value" && tokenPrefix) {
      const { key, valuePrefix } = tokenPrefix;
      const lowerPrefix = valuePrefix.toLowerCase();

      if (key === "status") {
        // Suggest status values
        for (const opt of STATUS_OPTIONS) {
          if (
            opt.value !== "all" &&
            opt.value.toLowerCase().startsWith(lowerPrefix)
          ) {
            items.push({
              type: "status",
              label: opt.label,
              value: opt.value,
            });
          }
        }
      } else {
        // Suggest tag values
        for (const tv of tagValues) {
          if (tv.value.toLowerCase().startsWith(lowerPrefix)) {
            items.push({
              type: "value",
              label: `${tv.value} (${tv.count})`,
              value: tv.value,
            });
          }
        }
      }
    } else if (!currentToken) {
      // Show default suggestions when empty or no current token
      for (const tag of tagFields.slice(0, 4)) {
        items.push({
          type: "key",
          label: `${tag}:`,
          value: `${tag}:`,
        });
      }
      if (!tagFields.includes("status")) {
        items.push({
          type: "key",
          label: "status:",
          value: "status:",
        });
      }
    }

    return items.slice(0, 8);
  }, [currentToken, tokenType, tokenPrefix, tagFields, tagValues, inputValue]);

  // Parse active filters from input value
  const activeFilters = React.useMemo(() => {
    return parseSearchQuery(inputValue);
  }, [inputValue]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(0);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: (typeof suggestions)[0]) => {
    const cursorPos = inputRef.current?.selectionStart ?? inputValue.length;
    const beforeCursor = inputValue.slice(0, cursorPos);
    const afterCursor = inputValue.slice(cursorPos);

    // Find the start of the current token
    const lastSpaceIndex = beforeCursor.lastIndexOf(" ");
    const tokenStart = lastSpaceIndex + 1;

    let newValue: string;
    let newStatus = status;

    if (suggestion.type === "status") {
      // Extract status value and set it
      const statusValue = suggestion.value.replace("status:", "");
      newStatus = statusValue;
      // Remove the current token from input
      newValue = beforeCursor.slice(0, tokenStart) + afterCursor.trimStart();
    } else if (suggestion.type === "key") {
      // Replace current token with the key prefix
      newValue =
        beforeCursor.slice(0, tokenStart) + suggestion.value + afterCursor;
    } else {
      // Replace the value part
      const key = tokenPrefix?.key ?? "";
      newValue = `${beforeCursor.slice(0, tokenStart)}${key}:${suggestion.value}${afterCursor.startsWith(" ") ? afterCursor : ` ${afterCursor.trimStart()}`}`;
    }

    setInputValue(newValue.trim());
    setShowSuggestions(false);
    onChange(newValue.trim(), newStatus);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onChange(inputValue, status);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Handle removing a filter chip
  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters.tags[key];
    const newQuery = buildSearchQuery(newFilters);
    setInputValue(newQuery);
    onChange(newQuery, status);
  };

  // Handle removing status filter
  const handleRemoveStatus = () => {
    onChange(inputValue, "all");
  };

  // Sync input value with prop
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters =
    Object.keys(activeFilters.tags).length > 0 || (status && status !== "all");

  // Handle confirm search
  const handleConfirmSearch = () => {
    setShowSuggestions(false);
    onChange(inputValue, status);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="h-9 w-full  border bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden  border bg-popover/95 shadow-lg backdrop-blur-sm">
            {/* Confirm search option */}
            <button
              type="button"
              onClick={handleConfirmSearch}
              className={cn(
                "flex w-full items-center justify-between border-b px-3 py-2.5 text-left text-sm transition-colors",
                selectedIndex === -1 ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              <span>Confirm search</span>
              <span className="text-muted-foreground">↵</span>
            </button>

            {/* Filter suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      " bg-muted px-3 py-1.5 font-mono text-sm transition-colors",
                      index === selectedIndex
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted/80",
                    )}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Status chip */}
          {status && status !== "all" && (
            <button
              type="button"
              onClick={handleRemoveStatus}
              className="group flex items-center gap-1  bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <span className="font-mono">status:{status}</span>
              <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          )}

          {/* Tag filter chips */}
          {Object.entries(activeFilters.tags).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleRemoveFilter(key)}
              className="group flex items-center gap-1  bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <span className="font-mono">
                {key}:{val.length > 16 ? `${val.slice(0, 16)}...` : val}
              </span>
              <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          ))}

          {/* Clear all */}
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onChange("", "all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
