"use client";

import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@midday/ui/button";
import { ChevronDown } from "lucide-react";

export function ExportButton() {
  const { rowSelection } = useTransactionsStore((state) => state);
  const disabled = !Object.keys(rowSelection).length;

  return (
    <Button
      disabled={disabled}
      className="space-x-2"
      variant={disabled ? "outline" : "default"}
    >
      <span>Export</span> <ChevronDown size={16} />
    </Button>
  );
}
