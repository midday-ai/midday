"use client";

import { generateFilters } from "@/actions/ai/filters/generate-filters";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { readStreamableValue } from "ai/rsc";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  placeholder: string;
  validFilters: string[];
};

const defaultSearch = {
  q: null,
  attachments: null,
};

export function SearchFilter({ placeholder, validFilters }: Props) {
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);

  const [search, setSearch] = useQueryStates(
    {
      q: parseAsString,
      attachments: parseAsStringLiteral(["exclude", "include"] as const),
    },
    {
      shallow: false,
    },
  );

  useHotkeys(
    "esc",
    () => {
      setPrompt("");
      setSearch(defaultSearch);
    },
    {
      enableOnFormTags: true,
    },
  );

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setPrompt(value);
    } else {
      setSearch(defaultSearch);
      setPrompt("");
    }
  };

  const handleSubmit = async () => {
    if (prompt.split(" ").length > 1) {
      setStreaming(true);
      const { object } = await generateFilters(prompt, validFilters);
      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          setSearch({
            q: null,
            ...partialObject,
          });
        }
      }

      setStreaming(false);
    } else {
      setSearch({ q: prompt });
    }
  };

  return (
    <form
      className="w-full md:max-w-[350px] relative"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
      <Input
        placeholder={placeholder}
        className="pl-9 w-full"
        value={prompt}
        onChange={handleSearch}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
    </form>
  );
}
