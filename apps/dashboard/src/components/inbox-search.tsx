"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useHotkeys } from "react-hotkeys-hook";

export function InboxSearch({ value, onChange, onClear, onArrowDown }) {
  useHotkeys("esc", () => onClear(), {
    enableOnFormTags: true,
    enabled: Boolean(value),
  });

  return (
    <div className="relative w-full">
      <Icons.Search className="w-[20px] h-[20px] absolute left-2 top-2 pointer-events-none" />
      <Input
        placeholder="Search inbox"
        onKeyDown={(evt) => {
          if (evt.key === "ArrowDown") {
            evt.target?.blur();
            evt.preventDefault();
            onArrowDown?.();
          }
        }}
        className="pl-8"
        value={value}
        onChange={(evt) => {
          const value = evt.target.value;
          onChange(value.length ? value : null);
        }}
      />

      {value && (
        <Icons.Close
          className="w-[18px] h-[18px] top-[9px] absolute right-2"
          onClick={() => onClear?.()}
        />
      )}
    </div>
  );
}
