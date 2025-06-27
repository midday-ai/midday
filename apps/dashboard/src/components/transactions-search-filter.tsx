"use client";

import { generateTransactionsFilters } from "@/actions/ai/filters/generate-transactions-filters";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useTransactionFilterParamsWithPersistence } from "@/hooks/use-transaction-filter-params-with-persistence";
import { useTRPC } from "@/trpc/client";
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
import { useQuery } from "@tanstack/react-query";
import { readStreamableValue } from "ai/rsc";
import { formatISO } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AmountRange } from "./amount-range";
import { FilterList } from "./filter-list";
import { SelectCategory } from "./select-category";

type StatusFilter = "completed" | "uncompleted" | "archived" | "excluded";
type AttachmentFilter = "include" | "exclude";
type RecurringFilter = "all" | "weekly" | "monthly" | "annually";

interface BaseFilterItem {
  name: string;
}

interface FilterItem<T extends string> extends BaseFilterItem {
  id: T;
}

interface FilterMenuItemProps {
  icon: (typeof Icons)[keyof typeof Icons];
  label: string;
  children: React.ReactNode;
}

interface FilterCheckboxItemProps {
  id: string;
  name: string;
  checked?: boolean;
  className?: string;
  onCheckedChange: () => void;
}

// Static data
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
  tags: null,
  amount_range: null,
};

const PLACEHOLDERS = [
  "Software and taxes last month",
  "Income last year",
  "Software last Q4",
  "From Google without receipt",
  "Search or filter",
  "Without receipts this month",
];

const statusFilters: FilterItem<StatusFilter>[] = [
  { id: "completed", name: "Completed" },
  { id: "uncompleted", name: "Uncompleted" },
  { id: "archived", name: "Archived" },
  { id: "excluded", name: "Excluded" },
];

const attachmentsFilters: FilterItem<AttachmentFilter>[] = [
  { id: "include", name: "Has attachments" },
  { id: "exclude", name: "No attachments" },
];

const recurringFilters: FilterItem<RecurringFilter>[] = [
  { id: "all", name: "All recurring" },
  { id: "weekly", name: "Weekly recurring" },
  { id: "monthly", name: "Monthly recurring" },
  { id: "annually", name: "Annually recurring" },
];

// Reusable components
function FilterMenuItem({ icon: Icon, label, children }: FilterMenuItemProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Icon className="mr-2 size-4" />
          <span>{label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent
            sideOffset={14}
            alignOffset={-4}
            className="p-0"
          >
            {children}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}

function FilterCheckboxItem({
  id,
  name,
  checked = false,
  onCheckedChange,
  className,
}: FilterCheckboxItemProps) {
  return (
    <DropdownMenuCheckboxItem
      key={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={className}
    >
      {name}
    </DropdownMenuCheckboxItem>
  );
}

function useFilterData(isOpen: boolean, isFocused: boolean) {
  const trpc = useTRPC();
  const { filter } = useTransactionFilterParams();

  const shouldFetch = isOpen || isFocused;

  const { data: tagsData } = useQuery({
    ...trpc.tags.get.queryOptions(),
    enabled: shouldFetch || Boolean(filter.tags?.length),
  });

  const { data: bankAccountsData } = useQuery({
    ...trpc.bankAccounts.get.queryOptions({
      enabled: shouldFetch || Boolean(filter.accounts?.length),
    }),
  });

  // We want to fetch the categories data on mount
  const { data: categoriesData } = useQuery({
    ...trpc.transactionCategories.get.queryOptions(),
  });

  return {
    tags: tagsData?.map((tag) => ({
      id: tag.id,
      name: tag.name,
    })),
    accounts: bankAccountsData?.map((bankAccount) => ({
      id: bankAccount.id,
      name: bankAccount.name ?? "",
      currency: bankAccount.currency ?? "",
    })),
    categories: categoriesData?.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  };
}

function updateArrayFilter(
  value: string,
  currentValues: string[] | null | undefined,
  setFilter: (update: Record<string, unknown>) => void,
  key: string,
) {
  const normalizedValues = currentValues ?? null;
  const newValues = normalizedValues?.includes(value)
    ? normalizedValues.filter((v) => v !== value).length > 0
      ? normalizedValues.filter((v) => v !== value)
      : null
    : [...(normalizedValues ?? []), value];

  setFilter({ [key]: newValues });
}

export function TransactionsSearchFilter() {
  const [placeholder, setPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { filter = defaultSearch, setFilter } =
    useTransactionFilterParamsWithPersistence();
  const { tags, accounts, categories } = useFilterData(isOpen, isFocused);
  const [prompt, setPrompt] = useState(filter.q ?? "");

  useEffect(() => {
    const randomPlaceholder =
      PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)] ??
      "Search or filter";

    setPlaceholder(randomPlaceholder);
  }, []);

  useHotkeys(
    "esc",
    () => {
      setPrompt("");
      setFilter(defaultSearch);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(prompt) && isFocused,
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
      setFilter(defaultSearch);
      setPrompt("");
    }
  };

  const handleSubmit = async () => {
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

      setFilter({
        q: null,
        ...finalObject,
      });

      setStreaming(false);
    } else {
      setFilter({ q: prompt.length > 0 ? prompt : null });
    }
  };

  const validFilters = Object.fromEntries(
    Object.entries(filter).filter(([key]) => key !== "q"),
  );

  const hasValidFilters = Object.values(validFilters).some(
    (value) => value !== null,
  );

  const processFiltersForList = () => {
    return Object.fromEntries(
      Object.entries({
        ...validFilters,
        start: filter.start ?? undefined,
        end: filter.end ?? undefined,
        amount_range: filter.amount_range
          ? `${filter.amount_range[0]}-${filter.amount_range[1]}`
          : undefined,
        attachments: filter.attachments ?? undefined,
        categories: filter.categories ?? undefined,
        tags: filter.tags ?? undefined,
        accounts: filter.accounts ?? undefined,
        assignees: filter.assignees ?? undefined,
        statuses: filter.statuses ?? undefined,
        recurring: filter.recurring ?? undefined,
      }).filter(([_, value]) => value !== undefined && value !== null),
    );
  };

  const getAmountRange = () => {
    if (
      !filter.amount_range ||
      !Array.isArray(filter.amount_range) ||
      filter.amount_range.length < 2
    ) {
      return undefined;
    }
    return [filter.amount_range[0], filter.amount_range[1]] as [number, number];
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 items-stretch sm:items-center w-full">
        <form
          className="relative flex-1 sm:flex-initial"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            className="pl-9 w-full sm:w-[350px] pr-8"
            value={prompt}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
          filters={processFiltersForList()}
          loading={streaming}
          onRemove={setFilter}
          categories={categories}
          accounts={accounts}
          statusFilters={statusFilters}
          attachmentsFilters={attachmentsFilters}
          tags={tags}
          recurringFilters={recurringFilters}
          amountRange={getAmountRange()}
        />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        align="end"
        sideOffset={19}
        alignOffset={-11}
        side="top"
      >
        <FilterMenuItem icon={Icons.CalendarMonth} label="Date">
          <Calendar
            mode="range"
            initialFocus
            toDate={new Date()}
            selected={{
              from: filter.start ? new Date(filter.start) : undefined,
              to: filter.end ? new Date(filter.end) : undefined,
            }}
            onSelect={(range) => {
              if (!range) return;

              const newRange = {
                start: range.from
                  ? formatISO(range.from, { representation: "date" })
                  : null,
                end: range.to
                  ? formatISO(range.to, { representation: "date" })
                  : null,
              };

              setFilter(newRange);
            }}
          />
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Amount} label="Amount">
          <div className="w-[280px] p-4">
            <AmountRange />
          </div>
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Status} label="Status">
          {statusFilters.map(({ id, name }) => (
            <FilterCheckboxItem
              key={id}
              id={id}
              name={name}
              checked={filter?.statuses?.includes(id)}
              onCheckedChange={() =>
                updateArrayFilter(id, filter.statuses, setFilter, "statuses")
              }
            />
          ))}
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Attachments} label="Attachments">
          {attachmentsFilters.map(({ id, name }) => (
            <FilterCheckboxItem
              key={id}
              id={id}
              name={name}
              checked={filter?.attachments === id}
              onCheckedChange={() => {
                setFilter({
                  attachments: id,
                });
              }}
            />
          ))}
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Category} label="Categories">
          <div className="w-[250px] h-[270px]">
            <SelectCategory
              headless
              onChange={(selected) =>
                updateArrayFilter(
                  selected.slug,
                  filter.categories,
                  setFilter,
                  "categories",
                )
              }
            />
          </div>
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Status} label="Tags">
          <div className="max-h-[400px] overflow-y-auto">
            {tags && tags.length > 0 ? (
              tags.map((tag) => (
                <FilterCheckboxItem
                  key={tag.id}
                  id={tag.id}
                  name={tag.name}
                  checked={filter?.tags?.includes(tag.id)}
                  onCheckedChange={() =>
                    updateArrayFilter(tag.id, filter.tags, setFilter, "tags")
                  }
                />
              ))
            ) : (
              <p className="text-sm text-[#878787] px-2">No tags found</p>
            )}
          </div>
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Accounts} label="Accounts">
          {accounts?.map((account) => (
            <FilterCheckboxItem
              key={account.id}
              id={account.id}
              name={formatAccountName({
                name: account.name,
                currency: account.currency,
              })}
              checked={filter?.accounts?.includes(account.id)}
              onCheckedChange={() =>
                updateArrayFilter(
                  account.id,
                  filter.accounts,
                  setFilter,
                  "accounts",
                )
              }
            />
          ))}
        </FilterMenuItem>

        <FilterMenuItem icon={Icons.Repeat} label="Recurring">
          {recurringFilters.map(({ id, name }) => (
            <FilterCheckboxItem
              key={id}
              id={id}
              name={name}
              checked={filter?.recurring?.includes(id)}
              onCheckedChange={() =>
                updateArrayFilter(id, filter.recurring, setFilter, "recurring")
              }
            />
          ))}
        </FilterMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
