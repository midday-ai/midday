"use client";

import { CreateProjectForm } from "@/components/forms/create-project-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useQueryState } from "nuqs";
import React from "react";

export function TrackerCreateSheet() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [openValue, setOpen] = useQueryState("create");

  const isOpen = openValue === "project";

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={() => setOpen(null)}>
        <SheetContent>
          <SheetHeader className="mb-8 flex justify-between items-center flex-row">
            <h2 className="text-xl">Create Project</h2>
          </SheetHeader>

          <CreateProjectForm />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpen(null);
        }
      }}
    >
      <DrawerContent className="p-6">
        <DrawerHeader className="mb-8 flex justify-between items-center flex-row">
          <h2 className="text-xl">Create Project</h2>
        </DrawerHeader>

        <CreateProjectForm />
      </DrawerContent>
    </Drawer>
  );
}
