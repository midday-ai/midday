"use client";

import { deleteProjectAction } from "@/actions/project/delete-project-action";
import { updateProjectAction } from "@/actions/project/update-project-action";
import { updateProjectSchema } from "@/actions/schema";
import { TrackerProjectForm } from "@/components/forms/tracker-project-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
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

  const deleteAction = useAction(deleteProjectAction, {
    onSuccess: () => {
      setParams({ update: null, projectId: null });
    },
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const updateAction = useAction(updateProjectAction, {
    onSuccess: () => setParams({ update: null, projectId: null }),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const handleShareURL = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/tracker?projectId=${id}`
      );

      toast({
        duration: 4000,
        title: "Copied URL to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  if (isDesktop) {
    return (
      <AlertDialog>
        <Sheet
          open={isOpen}
          onOpenChange={() => setParams({ update: null, projectId: null })}
        >
          <SheetContent>
            <SheetHeader className="mb-8 flex justify-between items-center flex-row">
              <h2 className="text-xl">Edit Project</h2>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Icons.MoreVertical className="w-5 h-5" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-42"
                  sideOffset={10}
                  align="end"
                >
                  <DropdownMenuItem onClick={() => handleShareURL(data.id)}>
                    Share URL
                  </DropdownMenuItem>

                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
            </SheetHeader>

            <ScrollArea className="h-full p-0 pb-28">
              <TrackerProjectForm
                form={form}
                isSaving={updateAction.status === "executing"}
                onSubmit={updateAction.execute}
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAction.execute({ id: data.id })}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
          <h2 className="text-xl">Edit Project</h2>
        </DrawerHeader>

        <TrackerProjectForm
          form={form}
          isSaving={updateAction.status === "executing"}
          onSubmit={updateAction.execute}
        />
      </DrawerContent>
    </Drawer>
  );
}
