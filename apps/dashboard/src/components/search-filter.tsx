"use client";

import { generateFilters } from "@/actions/ai/filters/generate-filters";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { readStreamableValue } from "ai/rsc";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";

type Props = {
  placeholder: string;
  validFilters: string[];
  categories?: {
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
};

const defaultSearch = {
  q: null,
  attachments: null,
  start: null,
  end: null,
  categories: null,
  accounts: null,
  assignees: null,
};

export function SearchFilter({
  placeholder,
  validFilters,
  categories,
  accounts,
  members,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString,
      attachments: parseAsStringLiteral(["exclude", "include"] as const),
      start: parseAsString,
      end: parseAsString,
      categories: parseAsArrayOf(parseAsString),
      accounts: parseAsArrayOf(parseAsString),
      assignees: parseAsArrayOf(parseAsString),
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
    },
    {
      enableOnFormTags: true,
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

      const { object } = await generateFilters(
        prompt,
        validFilters,
        categories
          ? `Categories: ${categories?.map((category) => category.name).join(", ")} \n
             Accounts: ${accounts?.map((account) => account.name).join(", ")} \n
             Buyers: ${members?.map((member) => member.name).join(", ")}
              `
          : "",
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
            accounts:
              partialObject?.accounts?.map(
                (name: string) =>
                  accounts?.find((account) => account.name === name)?.id,
              ) ?? null,
            assignees:
              partialObject?.assignees?.map(
                (name: string) =>
                  members?.find((member) => member.name === name)?.id,
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
    } else {
      setFilters({ q: prompt.length > 0 ? prompt : null });
    }
  };

  const hasValidFilters =
    Object.entries(filters).filter(
      ([key, value]) => value !== null && key !== "q",
    ).length > 0;

  return (
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
          className="pl-9 w-full md:w-[320px] pr-8"
          value={prompt}
          onChange={handleSearch}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        <Icons.Filter
          className={cn(
            "absolute right-3 top-[10px] opacity-50 transition-opacity duration-300",
            hasValidFilters && "opacity-1",
          )}
        />
      </form>

      <FilterList
        filters={filters}
        loading={streaming}
        onRemove={setFilters}
        categories={categories}
        accounts={accounts}
        members={members}
      />
    </div>
  );
}
