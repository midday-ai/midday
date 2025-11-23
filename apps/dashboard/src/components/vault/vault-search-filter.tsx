"use client";

import {
  vaultFilterOutputSchema,
  vaultFilterSchema,
} from "@/app/api/ai/filters/vault/schema";
import type { VaultFilterSchema } from "@/app/api/ai/filters/vault/schema";
import { FilterList } from "@/components/filter-list";
import { normalizeString, useAIFilter } from "@/hooks/use-ai-filter";
import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useTRPC } from "@/trpc/client";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export function VaultSearchFilter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const trpc = useTRPC();

  const { filter, setFilter } = useDocumentFilterParams();
  const [input, setInput] = useState(filter.q ?? "");

  const shouldFetch = isOpen;

  const { data: tagsData } = useQuery({
    ...trpc.documentTags.get.queryOptions(),
    enabled: shouldFetch || Boolean(filter.tags?.length),
  });

  const mapVaultFilters = useCallback((object: VaultFilterSchema) => {
    return {
      q: normalizeString(object.name),
      tags: null,
      start: normalizeString(object.start),
      end: normalizeString(object.end),
    };
  }, []);

  const { submit, isLoading } = useAIFilter({
    api: "/api/ai/filters/vault",
    inputSchema: vaultFilterSchema,
    outputSchema: vaultFilterOutputSchema,
    mapper: mapVaultFilters,
    onFilterApplied: setFilter,
  });

  useHotkeys(
    "esc",
    () => {
      setInput("");
      setFilter(null);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(input) && isFocused,
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setInput(value);
    } else {
      setFilter(null);
      setInput("");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (input.split(" ").length > 1) {
      submit({
        input,
        currentDate: formatISO(new Date(), { representation: "date" }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } else {
      setFilter({ q: input.length > 0 ? input : null });
    }
  };

  const validFilters = Object.fromEntries(
    Object.entries(filter).filter(([key]) => key !== "q"),
  );

  const hasValidFilters = Object.values(validFilters).some(
    (value) => value !== null,
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex space-x-4 items-center">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search or type filter"
            className="pl-9 w-full md:w-[350px] pr-8"
            value={input}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <DropdownMenuTrigger asChild>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              type="button"
              className={cn(
                "absolute z-10 right-3 top-[10px] opacity-50 transition-opacity duration-300 hover:opacity-100",
                hasValidFilters && "opacity-100",
                isOpen && "opacity-100",
              )}
            >
              <Icons.Filter />
            </button>
          </DropdownMenuTrigger>
        </form>

        <FilterList
          filters={validFilters}
          loading={isLoading}
          onRemove={setFilter}
          tags={tagsData}
        />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        align="end"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CalendarMonth className="mr-2 h-4 w-4" />
              <span>Date</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                <Calendar
                  mode="range"
                  initialFocus
                  toDate={new Date()}
                  selected={
                    filter.start || filter.end
                      ? {
                          from: filter.start
                            ? new Date(filter.start)
                            : undefined,
                          to: filter.end ? new Date(filter.end) : undefined,
                        }
                      : undefined
                  }
                  onSelect={(range) => {
                    if (!range) return;

                    const newRange = {
                      start: range.from
                        ? formatISO(range.from, { representation: "date" })
                        : filter.start,
                      end: range.to
                        ? formatISO(range.to, { representation: "date" })
                        : filter.end,
                    };

                    setFilter(newRange);
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Tags</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0 max-h-[300px] overflow-y-auto"
              >
                {tagsData?.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    onCheckedChange={() => {
                      setFilter({
                        tags: filter?.tags?.includes(tag.id)
                          ? filter.tags.filter((s) => s !== tag.id)
                          : [...(filter?.tags ?? []), tag.id],
                      });
                    }}
                  >
                    {tag.name}
                  </DropdownMenuCheckboxItem>
                ))}

                {!tagsData?.length && (
                  <DropdownMenuItem disabled>No tags found</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
