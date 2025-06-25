"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useCustomerParams } from "@/hooks/use-customer-params";

export function OpenCustomerSheet() {
  const { setParams } = useCustomerParams();

  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ createCustomer: true })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
