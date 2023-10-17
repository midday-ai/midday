"use client";

import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@midday/ui/button";
import { ChevronDown } from "lucide-react";

export function ExportButton() {
  const isSomeRowsSelected = useTransactionsStore(
    (state) => state.isSomeRowsSelected,
  );

  return (
    <Button
      disabled={!isSomeRowsSelected}
      className="space-x-2"
      variant={isSomeRowsSelected ? "default" : "outline"}
    >
      <span>Export</span> <ChevronDown size={16} />
    </Button>
  );
}
