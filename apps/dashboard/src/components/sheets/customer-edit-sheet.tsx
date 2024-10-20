"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { createClient } from "@midday/supabase/client";
import { getCustomerQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React, { useEffect, useState } from "react";
import { CustomerForm } from "../forms/customer-form";
import type { Customer } from "../invoice/customer-details";

export function CustomerEditSheet() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const { setParams, customerId } = useCustomerParams();

  const isOpen = Boolean(customerId);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCustomer() {
      const { data } = await getCustomerQuery(supabase, customerId);

      console.log(data);
      if (data) {
        setCustomer(data);
      }
    }

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent style={{ maxWidth: 610 }} stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Edit Customer</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setParams(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <CustomerForm data={customer} />
      </SheetContent>
    </Sheet>
  );
}
