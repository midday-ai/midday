"use client";

import ExportTransactionsModal from "@/components/modals/export-transactions-modal";
import { Button } from "@midday/ui/button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ExportButton() {
  const [isOpen, setOpen] = useState();

  const searchParams = useSearchParams();
  const hasFilters =
    searchParams.get("filter") &&
    Object.keys(JSON.parse(searchParams.get("filter"))).length > 0;

  return (
    <>
      <Button
        className="space-x-2"
        variant={hasFilters ? "default" : "outline"}
        disabled={!hasFilters}
        onClick={() => setOpen(true)}
      >
        Export
      </Button>
      <ExportTransactionsModal isOpen={isOpen} setOpen={setOpen} />
    </>
  );
}
