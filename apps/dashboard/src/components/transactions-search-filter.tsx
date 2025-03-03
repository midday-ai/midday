"use client";

import { generateTransactionsFilters } from "@/actions/ai/filters/generate-transactions-filters";
import { formatAccountName } from "@/utils/format";
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
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AmountRange } from "./amount-range";
import { FilterList } from "./filter-list";
import { SelectCategory } from "./select-category";

type Props = {
  placeholder: string;
  categories?: {
    id: string;
    slug: string;
    name: string;
  }[];
  accounts?: {
    id: string;
    name: string;
    currency: string;
  }[];
  members?: {
    id: string;
    name: string;
  }[];
  tags?: {
    id: string;
    name: string;
  }[];
};

const defaultSearch = {
  q: null,
  attachments: null,
  start: null,
  end: null,
  categories: null,
  accounts: null,
  assignees: null,
  statuses: null,
  recurring: null,
};

const statusFilters = [
  { id: "completed", name: "Completed" },
  { id: "uncompleted", name: "Uncompleted" },
  { id: "archived", name: "Archived" },
  { id: "excluded", name: "Excluded" },
];

const attachmentsFilters = [
  { id: "include", name: "Has attachments" },
  { id: "exclude", name: "No attachments" },
];

const recurringFilters = [
  { id: "all", name: "All recurring" },
  { id: "weekly", name: "Weekly recurring" },
  { id: "monthly", name: "Monthly recurring" },
  { id: "annually", name: "Annually recurring" },
];

const PLACEHOLDERS = [
  "Software and taxes last month",
  "Income last year",
  "Software last Q4",
  "From Google without receipt",
  "Search or filter",
  "Without receipts this month",
];

const placeholder =
  PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

export function TransactionsSearchFilter({
  categories,
  accounts,
  members,
  tags,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString,
      attachments: parseAsStringLiteral(["exclude", "include"] as const),
      start: parseAsString,
      end: parseAsString,
      categories: parseAsArrayOf(parseAsString),
      tags: parseAsArrayOf(parseAsString),
      accounts: parseAsArrayOf(parseAsString),
      assignees: parseAsArrayOf(parseAsString),
      amount_range: parseAsArrayOf(parseAsInteger),
      recurring: parseAsArrayOf(
        parseAsStringLiteral(["all", "weekly", "monthly", "annually"] as const),
      ),
      statuses: parseAsArrayOf(
        parseAsStringLiteral([
          "completed",
          "uncompleted",
          "archived",
          "excluded",
        ] as const),
      ),
    },
    {
      shallow: false,
      history: "push",
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
    // If the user is typing a query with multiple words, we want to stream the results
    if (prompt.split(" ").length > 1) {
      setStreaming(true);

      const { object } = await generateTransactionsFilters(
        prompt,
        `
          Categories: ${categories?.map((category) => category.name).join(", ")}
          Tags: ${tags?.map((tag) => tag.name).join(", ")}
        `,
      );

      let finalObject = {};

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          finalObject = {
            ...finalObject,
            ...partialObject,
            categories:
              partialObject?.categories?.map(
                (name: string) =>
                  categories?.find((category) => category.name === name)?.slug,
              ) ?? null,
            tags:
              partialObject?.tags?.map(
                (name: string) => tags?.find((tag) => tag.name === name)?.id,
              ) ?? null,
            recurring: partialObject?.recurring ?? null,
            q: partialObject?.name ?? null,
            amount_range: partialObject?.amount_range ?? null,
          };
        }
      }

      setFilters({
        q: null,
        ...finalObject,
      });

      setStreaming(false);
    } else {
      setFilters({ q: prompt.length > 0 ? prompt : null });
    }
  };

  const hasValidFilters =
    Object.entries(filters).filter(
      ([key, value]) => value !== null && key !== "q",
    ).length > 0;

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
            placeholder={placeholder}
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

        <FilterList
          filters={filters}
          loading={streaming}
          onRemove={setFilters}
          categories={categories}
          accounts={accounts}
          members={members}
          statusFilters={statusFilters}
          attachmentsFilters={attachmentsFilters}
          tags={tags}
          recurringFilters={recurringFilters}
          amountRange={filters.amount_range}
        />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        align="end"
        sideOffset={19}
        alignOffset={-11}
        side="top"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CalendarMonth className="mr-2 size-4" />
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
                    from: filters.start && new Date(filters.start),
                    to: filters.end && new Date(filters.end),
                  }}
                  onSelect={(range) => {
                    if (!range) return;

                    const newRange = {
                      start: range.from
                        ? formatISO(range.from, { representation: "date" })
                        : filters.start,
                      end: range.to
                        ? formatISO(range.to, { representation: "date" })
                        : filters.end,
                    };

                    setFilters(newRange);
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Amount className="mr-2 size-4" />
              <span>Amount</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="w-[280px] p-4"
              >
                <AmountRange />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 size-4" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {statusFilters.map(({ id, name }) => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={filters?.statuses?.includes(id)}
                    onCheckedChange={() => {
                      setFilters({
                        statuses: filters?.statuses?.includes(id)
                          ? filters.statuses.filter((s) => s !== id).length > 0
                            ? filters.statuses.filter((s) => s !== id)
                            : null
                          : [...(filters?.statuses ?? []), id],
                      });
                    }}
                  >
                    {name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Attachments className="mr-2 size-4" />
              <span>Attachments</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {attachmentsFilters.map(({ id, name }) => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={filters?.attachments?.includes(id)}
                    onCheckedChange={() => {
                      setFilters({
                        attachments: id,
                      });
                    }}
                  >
                    {name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Category className="mr-2 size-4" />
              <span>Categories</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-101}
                className="p-0 w-[250px] h-[270px]"
              >
                <SelectCategory
                  uncategorized
                  onChange={(selected) => {
                    setFilters({
                      categories: filters?.categories?.includes(selected.slug)
                        ? filters.categories.filter((s) => s !== selected.slug)
                            .length > 0
                          ? filters.categories.filter(
                              (s) => s !== selected.slug,
                            )
                          : null
                        : [...(filters?.categories ?? []), selected.slug],
                    });
                  }}
                  headless
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
                className="py-2 max-h-[200px] overflow-y-auto max-w-[220px]"
              >
                {tags?.length > 0 ? (
                  tags?.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={filters?.tags?.includes(tag.id)}
                      onCheckedChange={() => {
                        setFilters({
                          tags: filters?.tags?.includes(tag.id)
                            ? filters.tags.filter((s) => s !== tag.id).length >
                              0
                              ? filters.tags.filter((s) => s !== tag.id)
                              : null
                            : [...(filters?.tags ?? []), tag.id],
                        });
                      }}
                    >
                      {tag.name}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <p className="text-sm text-[#878787] px-2">No tags found</p>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Accounts className="mr-2 size-4" />
              <span>Accounts</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {accounts?.map((account) => (
                  <DropdownMenuCheckboxItem
                    key={account.id}
                    onCheckedChange={() => {
                      setFilters({
                        accounts: filters?.accounts?.includes(account.id)
                          ? filters.accounts.filter((s) => s !== account.id)
                              .length > 0
                            ? filters.accounts.filter((s) => s !== account.id)
                            : null
                          : [...(filters?.accounts ?? []), account.id],
                      });
                    }}
                  >
                    {formatAccountName({
                      name: account.name,
                      currency: account.currency,
                    })}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Repeat className="mr-2 size-4" />
              <span>Recurring</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {recurringFilters.map(({ id, name }) => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={filters?.statuses?.includes(id)}
                    onCheckedChange={() => {
                      setFilters({
                        recurring: filters?.recurring?.includes(id)
                          ? filters.recurring.filter((s) => s !== id).length > 0
                            ? filters.recurring.filter((s) => s !== id)
                            : null
                          : [...(filters?.recurring ?? []), id],
                      });
                    }}
                  >
                    {name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
