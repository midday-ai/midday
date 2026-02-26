"use client";

import { useReconciliationFilterParams } from "@/hooks/use-reconciliation-filter-params";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { DateRangeFilter } from "./date-range-filter";

const MATCH_STATUSES = [
  { id: "unmatched", name: "Unmatched" },
  { id: "auto_matched", name: "Auto-Matched" },
  { id: "suggested", name: "Suggested" },
  { id: "manual_matched", name: "Manual Match" },
  { id: "flagged", name: "Flagged" },
  { id: "excluded", name: "Excluded" },
] as const;

export function ReconciliationSearchFilter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { filter, setFilter, hasFilters } = useReconciliationFilterParams();

  useHotkeys(
    "/",
    (e) => {
      e.preventDefault();
      inputRef.current?.focus();
    },
    { enableOnFormTags: false },
  );

  const handleSearch = useCallback(
    (q: string) => {
      setFilter({ q: q || null });
    },
    [setFilter],
  );

  const handleToggleMatchStatus = useCallback(
    (id: string) => {
      const current = filter.matchStatus || [];
      const next = current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id];
      setFilter({ matchStatus: next.length > 0 ? next : null });
    },
    [filter.matchStatus, setFilter],
  );

  const handleDateRange = useCallback(
    (range: { start: string | null; end: string | null }) => {
      setFilter({
        start: range.start,
        end: range.end,
      });
    },
    [setFilter],
  );

  const handleClearAll = useCallback(() => {
    setFilter({
      q: null,
      matchStatus: null,
      start: null,
      end: null,
      accounts: null,
      deals: null,
      confidenceMin: null,
    });
  }, [setFilter]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Icons.Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={16}
        />
        <Input
          ref={inputRef}
          placeholder="Search transactions..."
          className="pl-9 w-[280px] h-[34px]"
          value={filter.q || ""}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-3 h-[34px] text-sm border rounded-md transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              hasFilters && "border-primary text-primary",
            )}
          >
            <Icons.Filter size={14} />
            <span>Filter</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuGroup>
            {MATCH_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.id}
                checked={filter.matchStatus?.includes(status.id) ?? false}
                onCheckedChange={() => handleToggleMatchStatus(status.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {status.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DateRangeFilter
        start={filter.start}
        end={filter.end}
        onSelect={handleDateRange}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
