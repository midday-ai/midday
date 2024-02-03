"use client";

import { updateProjectAction } from "@/actions/project/update-project-action";
import { updateProjectSchema } from "@/actions/schema";
import { TrackerProjectForm } from "@/components/forms/tracker-project-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export function TrackerUpdateSheet({ currencyCode, data, isOpen, setParams }) {
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const form = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name ?? undefined,
      description: data?.description ?? undefined,
      rate: data?.rate ?? undefined,
      status: data?.status ?? undefined,
      billable: data?.billable ?? undefined,
      estimate: data?.estimate ?? undefined,
      currency: (data?.currency || currencyCode) ?? undefined,
    },
  });

  const action = useAction(updateProjectAction, {
    onSuccess: () => setParams({ update: null, projectId: null }),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  if (isDesktop) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={() => setParams({ update: null, projectId: null })}
      >
        <SheetContent>
          <SheetHeader className="mb-8 flex justify-between items-center flex-row">
            <h2 className="text-xl">Update Project</h2>
          </SheetHeader>

          <TrackerProjectForm
            form={form}
            isSaving={action.status === "executing"}
            onSubmit={action.execute}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setParams({ update: null, projectId: null });
        }
      }}
    >
      <DrawerContent className="p-6">
        <DrawerHeader className="mb-8 flex justify-between items-center flex-row">
          <h2 className="text-xl">Update Project</h2>
        </DrawerHeader>

        <TrackerProjectForm
          form={form}
          isSaving={action.status === "executing"}
          onSubmit={action.execute}
        />
      </DrawerContent>
    </Drawer>
  );
}
