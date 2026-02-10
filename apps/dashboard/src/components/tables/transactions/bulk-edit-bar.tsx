"use client";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BulkActions } from "@/components/bulk-actions";
import { Portal } from "@/components/portal";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";

export function BulkEditBar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { tab } = useTransactionTab();
  const { rowSelectionByTab, setRowSelection, canDelete } =
    useTransactionsStore();
  const [isOpen, setOpen] = useState(false);

  const isReviewTab = tab === "review";
  // BulkEditBar is only shown on "all" tab, so use all tab selection
  const rowSelection = rowSelectionByTab.all;
  const selectedCount = Object.keys(rowSelection).length;
  const hasSelection = selectedCount > 0;

  // Delete mutation for bulk delete
  const deleteTransactionsMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getReviewCount.queryKey(),
        });
        setRowSelection("all", {});
      },
    }),
  );

  // Show bar when transactions are selected outside review tab
  // (review tab uses ExportBar instead)
  const shouldShow = !isReviewTab && hasSelection;

  useEffect(() => {
    setOpen(shouldShow);
  }, [shouldShow]);

  const transactionIds = Object.keys(rowSelection);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative pointer-events-auto min-w-[400px] h-12">
              {/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
              <motion.div
                className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
              <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
                <span className="text-sm">{selectedCount} selected</span>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setRowSelection("all", {})}
                  >
                    Deselect
                  </Button>

                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Icons.Delete size={18} />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your transactions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteTransactionsMutation.mutate(transactionIds);
                            }}
                          >
                            {deleteTransactionsMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <div className="h-4 w-[1px] bg-border mx-1" />

                  <BulkActions ids={transactionIds} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
