"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useQueryState } from "nuqs";

export function SearchField() {
  const [search, setSearch] = useQueryState("q", {
    shallow: false,
  });

  const handleSearch = (evt) => {
    const value = evt.target.value;

    if (value) {
      setSearch(value);
    } else {
      setSearch(null);
    }
  };

  return (
    <div className="max-w-[350px] relative w-full">
      <Icons.Search className="absolute pointer-events-none left-3 top-[10px]" />
      <Input
        placeholder="Search transactions"
        className="pl-9 w-full"
        defaultValue={search}
        onChange={handleSearch}
      />
    </div>
  );
}
