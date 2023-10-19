"use client";

import { Button } from "@midday/ui/button";
import { ChevronDown } from "lucide-react";

export function ExportButton() {
  return (
    <Button className="space-x-2" variant="outline">
      <span>Export</span> <ChevronDown size={16} />
    </Button>
  );
}
