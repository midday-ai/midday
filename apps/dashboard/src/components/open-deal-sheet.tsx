"use client";

import { useDealParams } from "@/hooks/use-deal-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function OpenDealSheet() {
  const { setParams } = useDealParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ type: "create" })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
