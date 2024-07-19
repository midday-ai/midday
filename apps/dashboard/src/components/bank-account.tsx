"use client";

import { deleteBankAccountAction } from "@/actions/delete-bank-account-action";
import { updateBankAccountAction } from "@/actions/update-bank-account-action";
import { useI18n } from "@/locales/client";
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
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Switch } from "@midday/ui/switch";
import { MoreHorizontal } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { FormatAmount } from "./format-amount";
import { EditBankAccountModal } from "./modals/edit-bank-account-modal";

type Props = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  enabled: boolean;
  manual: boolean;
  type: string;
};

export function BankAccount({
  id,
  name,
  currency,
  balance,
  enabled,
  manual,
  type,
}: Props) {
  const [_, setStep] = useQueryState("step");
  const [isOpen, setOpen] = useState(false);
  const t = useI18n();

  const updateAccount = useAction(updateBankAccountAction);
  const deleteAccount = useAction(deleteBankAccountAction);

  const getInitials = () => {
    const formatted = name.toUpperCase();

    if (formatted.split(" ").length > 1) {
      return `${formatted.charAt(0)}${formatted.charAt(1)}`;
    }

    return formatted.charAt(0);
  };

  return (
    <div
      className={cn(
        "flex justify-between items-center mb-4 pt-4",
        !enabled && "opacity-60",
      )}
    >
      <div className="flex items-center space-x-4 w-full mr-8">
        <Avatar className="size-[34px]">
          <AvatarFallback className="text-[11px]">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <p className="font-medium leading-none mb-1 text-sm">
              {name} ({currency})
            </p>
            <span className="text-xs text-[#878787] font-normal">
              {t(`account_type.${type}`)}
            </span>
          </div>

          <span className="text-[#878787] text-sm">
            <FormatAmount amount={balance} currency={currency} />
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MoreHorizontal size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Reconnect</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setStep("import-csv");
                }}
              >
                Import
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <AlertDialogTrigger className="w-full text-left">
                  Remove
                </AlertDialogTrigger>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete a bank account. If you proceed, all
                transactions associated with this account will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteAccount.status === "executing"}
                onClick={() =>
                  deleteAccount.execute({
                    id,
                  })
                }
              >
                {deleteAccount.status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!manual && (
          <Switch
            checked={enabled}
            disabled={updateAccount.status === "executing"}
            onCheckedChange={(enabled: boolean) => {
              updateAccount.execute({ id, enabled });
            }}
          />
        )}
      </div>

      <EditBankAccountModal
        id={id}
        onOpenChange={setOpen}
        isOpen={isOpen}
        defaultName={name}
        defaultType={type}
      />
    </div>
  );
}
