"use client";

import { useMerchantParams } from "@/hooks/use-merchant-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function OpenMerchantSheet() {
  const { setParams } = useMerchantParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ createMerchant: true })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
