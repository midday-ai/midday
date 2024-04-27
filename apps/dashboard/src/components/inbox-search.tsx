"use client";

import { Input } from "@midday/ui/input";

export function InboxSearch({ value, onChange }) {
  return (
    <Input
      placeholder="Search inbox"
      value={value}
      onChange={(evt) => {
        const value = evt.target.value;
        onChange(value.length ? value : null);
      }}
      className="w-full flex"
    />
  );
}
