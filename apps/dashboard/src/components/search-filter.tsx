"use client";

import { generateFilters } from "@/actions/ai/filters/generate-filters";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { readStreamableValue } from "ai/rsc";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";

type Props = {
  placeholder: string;
  validFilters: string[];
};

const defaultSearch = {
  q: null,
  attachments: null,
  start: null,
  end: null,
};

export function SearchFilter({ placeholder, validFilters }: Props) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString,
      attachments: parseAsStringLiteral(["exclude", "include"] as const),
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
    },
    {
      enableOnFormTags: true,
    },
  );

  useHotkeys("meta+f", (evt) => {
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

      const { object } = await generateFilters(prompt, validFilters);
      let finalObject = {};

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          finalObject = { ...finalObject, ...partialObject };
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
          className="pl-9 w-full md:w-[300px]"
          value={prompt}
          onChange={handleSearch}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        <kbd className="pointer-events-none absolute right-1.5 top-[8px] h-5 select-none items-center gap-0.5 flex px-1.5 font-mono text-[10px] font-medium text-[#878787]">
          <span className="text-[15px]">⌘</span>F
        </kbd>
      </form>

      <FilterList filters={filters} loading={streaming} onRemove={setFilters} />
    </div>
  );
}
