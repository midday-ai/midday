"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useQueryState } from "nuqs";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  placeholder: string;
};

export function SearchField({ placeholder }: Props) {
  const [search, setSearch] = useQueryState("q", {
    shallow: false,
  });

  useHotkeys("esc", () => setSearch(null), {
    enableOnFormTags: true,
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setSearch(value);
    } else {
      setSearch(null);
    }
  };

  return (
    <div className="w-full md:max-w-[350px] relative">
      <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
      <Input
        placeholder={placeholder}
        className="pl-9 w-full"
        value={search ?? ""}
        onChange={handleSearch}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  );
}
