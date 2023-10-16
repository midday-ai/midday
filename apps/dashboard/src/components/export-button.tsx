"use client";

import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@midday/ui/button";
import { ChevronDown } from "lucide-react";

export function ExportButton() {
  const { rowSelection } = useTransactionsStore((state) => state);

  return (
    <Button disabled={!Object.keys(rowSelection).length} className="space-x-2">
      <span>Export</span> <ChevronDown size={16} />
    </Button>
  );
}
