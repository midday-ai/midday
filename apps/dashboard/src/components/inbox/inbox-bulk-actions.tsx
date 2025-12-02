"use client";

import { useInboxStore } from "@/store/inbox";
import { useTRPC } from "@/trpc/client";
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
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import NumberFlow from "@number-flow/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function InboxBulkActions() {
  const { selectedIds, clearSelection } = useInboxStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isOpen, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedIdsArray = Object.keys(selectedIds);
  const selectedCount = selectedIdsArray.length;

  useEffect(() => {
    if (selectedCount > 0) {
      setOpen(true);
    } else {
      setOpen(false);
      setIsDialogOpen(false);
    }
  }, [selectedCount]);

  const deleteInboxMutation = useMutation(
    trpc.inbox.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.inbox.getById.queryKey(),
        });

        clearSelection();
      },
    }),
  );

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="h-12 fixed left-[50%] bottom-2 w-[400px] -ml-[200px] z-50"
          animate={{ y: isOpen ? 0 : 100 }}
          initial={{ y: 100 }}
        >
          <div className="mx-2 md:mx-0 backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C]">
            <span className="text-sm text-[#878787]">
              <NumberFlow value={selectedCount} /> selected
            </span>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => clearSelection()}>
                <span>Deselect all</span>
              </Button>
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button>
                    <Icons.Delete className="mr-2" size={16} />
                    <span>Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{" "}
                      {selectedCount}{" "}
                      {selectedCount === 1 ? "inbox item" : "inbox items"}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteInboxMutation.mutate(selectedIdsArray);
                      }}
                    >
                      {deleteInboxMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
