"use client";

import { CreateTransactionForm } from "@/components/forms/create-transaction-form";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { useQueryState } from "nuqs";
import React from "react";

export function CreateTransactionSheet({ categories }: { categories: any }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useQueryState("create");

  const isOpen = Boolean(open);

  const handleOpenChange = (open: boolean) => {
    setOpen(open ? "true" : null);
  };

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent>
          <SheetHeader className="mb-8">
            <SheetTitle>Create Transaction</SheetTitle>
          </SheetHeader>
          <CreateTransactionForm categories={categories} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="p-6">
        <CreateTransactionForm categories={categories} />
      </DrawerContent>
    </Drawer>
  );
}
