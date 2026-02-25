"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
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
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

type BankConnection = NonNullable<
  RouterOutputs["bankConnections"]["get"]
>[number];

type Props = {
  connection: BankConnection;
};

export function DeleteConnection({ connection }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const deleteConnectionMutation = useMutation(
    trpc.bankConnections.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bankConnections.get.queryKey(),
        });

        setOpen(false);
        setValue("");
      },
    }),
  );

  const accounts = connection.bankAccounts ?? [];
  const provider = connection.provider;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setValue("");
      }}
    >
      <TooltipProvider delayDuration={70}>
        <Tooltip>
          <AlertDialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 flex items-center"
                disabled={deleteConnectionMutation.isPending}
              >
                <Icons.Delete size={16} />
              </Button>
            </TooltipTrigger>
          </AlertDialogTrigger>

          <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
            Delete
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete connection</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will permanently remove the connection and all its accounts
                and transaction history. This cannot be undone.
              </p>
              <div className="my-6 px-3 py-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-amber-700 dark:text-amber-300">
                      {accounts.length > 0
                        ? "These accounts will be removed:"
                        : "No accounts in this connection."}
                    </p>
                    {accounts.length > 0 && (
                      <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-0.5">
                        {accounts.map((account) => (
                          <li key={account.id}>{account.name || "Unknown"}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-amber-700 dark:text-amber-300">
                      {provider
                        ? "Reconnecting later may not restore full history."
                        : "Connection data is stored only in Midday and cannot be recovered."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Label htmlFor="confirm-delete">
            Type <span className="font-medium">DELETE</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={value !== "DELETE" || deleteConnectionMutation.isPending}
            onClick={() =>
              deleteConnectionMutation.mutate({ id: connection.id })
            }
          >
            {deleteConnectionMutation.isPending ? (
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
