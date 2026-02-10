"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import type { Table } from "@tanstack/react-table";
import { useProductParams } from "@/hooks/use-product-params";
import type { Product } from "./columns";

type Props = {
  table: Table<Product>;
};

export function Header({ table }: Props) {
  const { setParams } = useProductParams();

  const handleCreateProduct = () => {
    setParams({ createProduct: true });
  };

  return (
    <div className="flex items-center py-4 justify-between">
      <Input
        placeholder="Search products..."
        value={(table?.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />

      <Button onClick={handleCreateProduct} className="space-x-2">
        Create
      </Button>
    </div>
  );
}
