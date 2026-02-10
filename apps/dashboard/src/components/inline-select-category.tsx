"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useState } from "react";
import { Category } from "@/components/category";
import { SelectCategory } from "@/components/select-category";

type Selected = {
  id: string;
  name: string;
  color?: string | null;
  slug: string;
  children?: Selected[];
};

type Props = {
  selected?: Selected;
  onChange: (selected: Selected) => void;
};

export function InlineSelectCategory({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (category: Selected) => {
    onChange(category);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full text-left hover:opacity-70 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Category name={selected?.name ?? ""} color={selected?.color ?? ""} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        side="bottom"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="w-[286px] h-[270px]">
          <SelectCategory
            headless
            selected={selected}
            onChange={handleSelect}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
