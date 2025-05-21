"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { getInitials } from "@/utils/format";
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
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Loader2 } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { FormatAmount } from "./format-amount";
import { EditBankAccountModal } from "./modals/edit-bank-account-modal";

type Props = {
  data: NonNullable<
    RouterOutputs["bankConnections"]["get"]
  >[number]["bankAccounts"][number];
};

export function BankAccount({ data }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [isOpen, setOpen] = useState(false);
  const t = useI18n();

  const [_, setParams] = useQueryStates({
    step: parseAsString,
    accountId: parseAsString,
    hide: parseAsBoolean,
    type: parseAsString,
  });

  const { id, enabled, manual, type, name, balance, currency } = data;

  const deleteAccountMutation = useMutation(
    trpc.bankAccounts.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bankAccounts.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.bankConnections.get.queryKey(),
        });

        setOpen(false);
      },
    }),
  );

  const updateAccountMutation = useMutation(
    trpc.bankAccounts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bankAccounts.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.bankConnections.get.queryKey(),
        });
      },
    }),
  );

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
            {getInitials(name ?? "")}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <p className="font-medium leading-none mb-1 text-sm">{name}</p>
          </div>

          {balance && currency ? (
            <span className="text-[#878787] text-sm">
              <FormatAmount amount={balance} currency={currency} />
            </span>
          ) : null}
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
              <DropdownMenuItem
                onClick={() => {
                  setParams({
                    step: "import",
                    accountId: id,
                    type,
                    hide: true,
                  });
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
                disabled={value !== "DELETE"}
                onClick={() => deleteAccountMutation.mutate({ id })}
              >
                {deleteAccountMutation.isPending ? (
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
            disabled={updateAccountMutation.isPending}
            onCheckedChange={(enabled: boolean) => {
              updateAccountMutation.mutate({ id, enabled });
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
        defaultBalance={balance}
      />
    </div>
  );
}
