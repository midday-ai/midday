"use client";

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
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  accountId: string;
};

export function DeleteInboxAccount({ accountId }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const deleteInboxAccountMutation = useMutation(
    trpc.inboxAccounts.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inboxAccounts.get.queryKey(),
        });

        setOpen(false);
        setValue("");
      },
    }),
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={70}>
        <Tooltip>
          <AlertDialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 flex items-center"
                disabled={deleteInboxAccountMutation.isPending}
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
          <AlertDialogTitle>Delete Email Connection</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete an email connection. If you proceed you will
            no longer receive new emails.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Label htmlFor="confirm-delete">
            Type <span className="font-medium">DELETE</span> to confirm.
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
            disabled={
              value !== "DELETE" || deleteInboxAccountMutation.isPending
            }
            onClick={() => deleteInboxAccountMutation.mutate({ id: accountId })}
          >
            {deleteInboxAccountMutation.isPending ? (
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
