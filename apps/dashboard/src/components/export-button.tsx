"use client";

import { Button } from "@midday/ui/button";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function ExportButton() {
  const searchParams = useSearchParams();
  const hasFilters =
    searchParams.get("filter") &&
    Object.keys(JSON.parse(searchParams.get("filter"))).length > 0;

  return (
    <Button
      className="space-x-2"
      variant={hasFilters ? "default" : "outline"}
      disabled={!hasFilters}
    >
      <span>Export</span> <ChevronDown size={16} />
    </Button>
  );
}
