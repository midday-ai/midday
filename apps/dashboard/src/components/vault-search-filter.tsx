"use client";

import { generateVaultFilters } from "@/actions/ai/filters/generate-vault-filters";
import { useI18n } from "@/locales/client";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";
import { SelectTag } from "./select-tag";
import { TAGS } from "./tables/vault/contants";

const defaultSearch = {
  q: null,
  start: null,
  end: null,
  owners: null,
  tags: null,
};

export function VaultSearchFilter({ members }: { members: any[] }) {
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
      owners: parseAsArrayOf(parseAsString),
      tags: parseAsArrayOf(parseAsString),
    },
    {
      shallow: false,
    },
  );

  const tags = TAGS.map((tag) => ({
    id: tag,
    name: t(`tags.${tag}`),
    slug: tag,
  }));

  useHotkeys(
    "esc",
    () => {
      setPrompt("");
      setFilters(defaultSearch);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(prompt),
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
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

    const { object } = await generateVaultFilters(
      prompt,
      `
        Users: ${members.map((member) => member.name).join(", ")},
        Tags: ${tags.map((tag) => tag.name).join(", ")},
        `,
    );

    let finalObject = {};

    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        finalObject = {
          ...finalObject,
          ...partialObject,
          owners:
            partialObject?.owners?.map(
              (name: string) =>
                members?.find((member) => member.name === name)?.id,
            ) ?? null,
          tags:
            partialObject?.tags?.map(
              (name: string) => tags?.find((tag) => tag.name === name)?.id,
            ) ?? null,
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
      <div className="flex space-x-4 items-center">
        <FilterList
          filters={filters}
          loading={streaming}
          onRemove={setFilters}
          members={members}
          tags={tags}
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
            placeholder="Search for..."
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

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Face className="mr-2 h-4 w-4" />
              <span>Members</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {members?.map((member) => (
                  <DropdownMenuCheckboxItem
                    key={member.id}
                    onCheckedChange={() => {
                      setFilters({
                        owners: filters?.owners?.includes(member.id)
                          ? filters.owners.filter((s) => s !== member.id)
                              .length > 0
                            ? filters.owners.filter((s) => s !== member.id)
                            : null
                          : [...(filters?.owners ?? []), member.id],
                      });
                    }}
                  >
                    {member.name}
                  </DropdownMenuCheckboxItem>
                ))}
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
                className="p-0"
              >
                <SelectTag
                  headless
                  onChange={(selected) => {
                    setFilters({
                      tags: filters?.tags?.includes(selected.slug)
                        ? filters.tags.filter((s) => s !== selected.slug)
                            .length > 0
                          ? filters.tags.filter((s) => s !== selected.slug)
                          : null
                        : [...(filters?.tags ?? []), selected.slug],
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
