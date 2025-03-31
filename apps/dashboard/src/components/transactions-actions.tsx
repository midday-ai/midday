"use client";

import { AddTransactions } from "@/components/add-transactions";
import { BulkActions } from "@/components/bulk-actions";
import { ColumnVisibility } from "@/components/column-visibility";
import { useTransactionsStore } from "@/store/transactions";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function TransactionsActions() {
  const { setRowSelection, canDelete, rowSelection } = useTransactionsStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteTransactionsMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        setRowSelection({});
      },
    }),
  );

  const transactionIds = Object.keys(rowSelection);

  if (transactionIds?.length) {
    return (
      <AlertDialog>
        <div className="ml-auto">
          <div className="flex items-center">
            <span className="text-sm text-[#606060] w-full">Bulk edit</span>
            <div className="h-8 w-[1px] bg-border ml-4 mr-4" />

            <div className="flex space-x-2">
              <BulkActions ids={transactionIds} />

              <div>
                {canDelete && (
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="bg-transparent border border-destructive hover:bg-transparent"
                    >
                      <Icons.Delete className="text-destructive" size={18} />
                    </Button>
                  </AlertDialogTrigger>
                )}
              </div>
            </div>
          </div>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTransactionsMutation.mutate({ ids: transactionIds });
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
    );
  }

  return (
    <div className="space-x-2 hidden md:flex">
      <ColumnVisibility />
      <AddTransactions />
    </div>
  );
}
