"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";

export function InboxSearch({ value, onChange }) {
  return (
    <div className="relative w-full">
      <Icons.Search className="w-[20px] h-[20px] absolute left-2 top-2 pointer-events-none" />
      <Input
        placeholder="Search inbox"
        className="pl-8"
        value={value}
        onChange={(evt) => {
          const value = evt.target.value;
          onChange(value.length ? value : null);
        }}
      />
    </div>
  );
}
