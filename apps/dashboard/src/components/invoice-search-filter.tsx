"use client";

import { generateVaultFilters } from "@/actions/ai/filters/generate-vault-filters";
import { useI18n } from "@/locales/client";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { readStreamableValue } from "ai/rsc";
import { formatISO } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";

const defaultSearch = {
  q: null,
  start: null,
  end: null,
};

export function InvoiceSearchFilter() {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const t = useI18n();

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString,
      start: parseAsString,
      end: parseAsString,
    },
    {
      shallow: false,
    },
  );

  useHotkeys(
    "esc",
    () => {
      setPrompt("");
      setFilters(defaultSearch);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  useHotkeys("meta+f", (evt) => {
    evt.preventDefault();
    setIsOpen((prev) => !prev);
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setPrompt(value);
    } else {
      setFilters(defaultSearch);
      setPrompt("");
    }
  };

  const handleSubmit = async () => {
    setStreaming(true);

    const { object } = await generateVaultFilters(prompt);

    let finalObject = {};

    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        finalObject = {
          ...finalObject,
          ...partialObject,
          q: partialObject?.name ?? null,
        };
      }
    }

    setFilters({
      q: null,
      ...finalObject,
    });

    setStreaming(false);
  };

  const hasValidFilters =
    Object.entries(filters).filter(
      ([key, value]) => value !== null && key !== "q",
    ).length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center">
        <FilterList
          filters={filters}
          loading={streaming}
          onRemove={setFilters}
        />

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
            placeholder="Search or filter"
            className="pl-9 w-full md:w-[350px] pr-8"
            value={prompt}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
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
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
        align="end"
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
                  today={filters.start ? new Date(filters.start) : new Date()}
                  toDate={new Date()}
                  selected={{
                    from: filters.start ? new Date(filters.start) : undefined,
                    to: filters.end ? new Date(filters.end) : undefined,
                  }}
                  onSelect={({ from, to }) => {
                    setFilters({
                      start: from
                        ? formatISO(from, { representation: "date" })
                        : null,
                      end: to
                        ? formatISO(to, { representation: "date" })
                        : null,
                    });
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
