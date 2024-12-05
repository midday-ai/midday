"use client";

import { deleteCustomerAction } from "@/actions/delete-customer-action";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { createClient } from "@midday/supabase/client";
import { getCustomerQuery } from "@midday/supabase/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";
import { CustomerForm } from "../forms/customer-form";
import type { Customer } from "../invoice/customer-details";

export function CustomerEditSheet() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const { setParams, customerId } = useCustomerParams();

  const isOpen = Boolean(customerId);
  const supabase = createClient();

  const deleteCustomer = useAction(deleteCustomerAction, {
    onSuccess: () => {
      setParams({
        customerId: null,
      });
    },
  });

  useEffect(() => {
    async function fetchCustomer() {
      if (customerId) {
        const { data } = await getCustomerQuery(supabase, customerId);

        if (data) {
          setCustomer(data as Customer);
        }
      }
    }

    if (customerId) {
      fetchCustomer();
    } else {
      setCustomer(null);
    }
  }, [customerId, supabase]);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Edit Customer</h2>

          {customerId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button">
                  <Icons.MoreVertical className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10} align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the customer and remove their data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteCustomer.execute({ id: customerId })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SheetHeader>

        <CustomerForm data={customer} />
      </SheetContent>
    </Sheet>
  );
}
