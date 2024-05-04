import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TransactionDetails } from "../transaction-details";

type Props = {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  data: any;
  ids?: string[];
};

export function TransactionSheet({ setOpen, isOpen, data, ids }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent>
          <TransactionDetails data={data} ids={ids} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpen(false);
        }
      }}
    >
      <DrawerContent className="p-6">
        <TransactionDetails data={data} ids={ids} />
      </DrawerContent>
    </Drawer>
  );
}
