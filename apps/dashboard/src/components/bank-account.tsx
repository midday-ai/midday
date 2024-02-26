"use client";

import { deleteBankAccountAction } from "@/actions/delete-bank-account-action";
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
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { EditBankAccountModal } from "./modals/edit-bank-account-modal";

export function BankAccount({
  id,
  name,
  bank_name,
  logo,
  last_accessed,
  currency,
}) {
  const [isOpen, setOpen] = useState(false);
  const delteAccount = useAction(deleteBankAccountAction);

  return (
    <div className="flex justify-between pt-6 items-center">
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src={logo} alt={name} />
        </Avatar>
        <div className="ml-4 flex flex-col">
          <p className="text-sm font-medium leading-none mb-1">{name}</p>
          <span className="text-xs font-medium text-[#606060]">
            {bank_name} ({currency})
          </span>
          <span className="text-xs text-[#606060]">
            Last accessed {formatDistanceToNow(new Date(last_accessed))} ago
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Remove</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                bank account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => delteAccount.execute({ id })}>
                {delteAccount.status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Continue"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <EditBankAccountModal
        id={id}
        onOpenChange={setOpen}
        isOpen={isOpen}
        defaultValue={name}
      />
    </div>
  );
}
