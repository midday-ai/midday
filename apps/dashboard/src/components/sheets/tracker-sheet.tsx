"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";

export function TrackerWidget() {
  return <TrackerMonthGraph date={new Date().toString()} />;
}

export function TrackerSheet({ setOpen, isOpen }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const onSelect = () => {};

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent>
          <TrackerMonthGraph date={new Date().toString()} onSelect={onSelect} />
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
        <TrackerMonthGraph date={new Date().toString()} onSelect={onSelect} />
      </DrawerContent>
    </Drawer>
  );
}
