"use client";

import { useCategoryParams } from "@/hooks/use-category-params";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import type { Table } from "@tanstack/react-table";
import type { Category } from "./columns";

type Props = {
  table?: Table<Category>;
};

export function Header({ table }: Props) {
  const { setParams } = useCategoryParams();

  const handleCreateCategory = () => {
    setParams({ createCategory: true });
  };

  return (
    <div className="flex items-center py-4 justify-between">
      <Input
        placeholder="Search..."
        value={(table?.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />

      <Button onClick={handleCreateCategory}>Create</Button>
    </div>
  );
}
