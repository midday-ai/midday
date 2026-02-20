"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Skeleton } from "@midday/ui/skeleton";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { useToast } from "@midday/ui/use-toast";
import { getInitials } from "@midday/utils/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { FormatAmount } from "../format-amount";

function RowsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index.toString()} className="flex justify-between">
          <div className="flex items-center space-x-4 mr-8 flex-1 min-w-0">
            <Skeleton className="size-[34px] rounded-full shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-[120px] rounded-none" />
                <Skeleton className="h-3 w-[50px] rounded-none" />
              </div>
              <div className="flex items-center justify-between mt-1">
                <Skeleton className="h-3 w-[80px] rounded-none" />
                <Skeleton className="h-3.5 w-[70px] rounded-none" />
              </div>
            </div>
          </div>
          <Skeleton className="h-5 w-9 rounded-full shrink-0 self-center" />
        </div>
      ))}
    </div>
  );
}

type ExistingAccount = NonNullable<
  RouterOutputs["bankConnections"]["get"]
>[number]["bankAccounts"][number];

type Props = {
  connectionId: string;
  provider: "gocardless" | "plaid" | "teller" | "enablebanking";
  accessToken: string | null;
  referenceId: string | null;
  enrollmentId: string | null;
  institutionId: string | null;
  existingAccounts: ExistingAccount[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAccountsAdded?: () => void;
};

function isExistingAccount(
  providerAccountId: string,
  existing: ExistingAccount[],
): boolean {
  return existing.some((e) => e.accountId === providerAccountId);
}

export function AddBankAccountsModal({
  connectionId,
  provider,
  accessToken,
  referenceId,
  enrollmentId,
  institutionId,
  existingAccounts,
  isOpen,
  onOpenChange,
  onAccountsAdded,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const id = provider === "teller" ? enrollmentId : referenceId;

  const {
    data: providerData,
    isLoading,
    isError,
  } = useQuery({
    ...trpc.banking.getProviderAccounts.queryOptions({
      provider,
      id: id ?? undefined,
      accessToken: accessToken ?? undefined,
      institutionId: institutionId ?? undefined,
    }),
    enabled: isOpen,
    retry: false,
  });

  const newAccounts = useMemo(() => {
    const accounts = providerData?.data ?? [];
    return accounts.filter((a) => !isExistingAccount(a.id, existingAccounts));
  }, [providerData, existingAccounts]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (providerData && newAccounts.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setSelectedIds(new Set(newAccounts.map((a) => a.id)));
    }
  }, [providerData, newAccounts]);

  const toggleAccount = (accountId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const addAccountsMutation = useMutation(
    trpc.bankConnections.addAccounts.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bankConnections.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bankAccounts.get.queryKey(),
        });
        setSelectedIds(new Set());
        onOpenChange(false);
        onAccountsAdded?.();
      },
      onError: () => {
        toast({
          duration: 3500,
          variant: "error",
          title: "Failed to add accounts. Please try again.",
        });
      },
    }),
  );

  const handleCreate = () => {
    const accountsToAdd = newAccounts
      .filter((a) => selectedIds.has(a.id))
      .map((a) => ({
        accountId: a.id,
        name: a.name,
        currency: a.currency ?? a.balance.currency,
        type: a.type,
        accountReference: a.resource_id,
        balance: a.balance.amount,
        iban: a.iban,
        subtype: a.subtype,
        bic: a.bic,
        routingNumber: a.routing_number,
        wireRoutingNumber: a.wire_routing_number,
        accountNumber: a.account_number,
        sortCode: a.sort_code,
        availableBalance: a.available_balance ?? null,
        creditLimit: a.credit_limit ?? null,
      }));

    if (accountsToAdd.length === 0) return;

    addAccountsMutation.mutate({
      connectionId,
      accounts: accountsToAdd,
    });
  };

  const selectedCount = newAccounts.filter((a) => selectedIds.has(a.id)).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedIds(new Set());
          initializedRef.current = false;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Add Accounts</DialogTitle>
            <p className="text-sm text-[#878787] mt-1">
              Select new accounts to add to this connection.
            </p>
          </DialogHeader>

          <div className="mt-6 space-y-6 max-h-[400px] overflow-auto scrollbar-hide">
            {isLoading && <RowsSkeleton />}

            {isError && (
              <p className="text-sm text-[#878787] text-center py-8">
                Failed to load accounts from bank provider. Please try
                reconnecting.
              </p>
            )}

            {providerData && newAccounts.length === 0 && (
              <p className="text-sm text-[#878787] text-center py-8">
                All accounts are already added.
              </p>
            )}

            {newAccounts.map((account) => (
              <div
                key={account.id}
                className="flex justify-between items-center"
              >
                <div className="flex items-center space-x-4 mr-8 flex-1 min-w-0">
                  <Avatar className="size-[34px]">
                    <AvatarFallback className="text-[11px]">
                      {getInitials(account.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium leading-none text-sm truncate">
                        {account.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#878787]">
                        {/* @ts-ignore */}
                        {t(`account_type.${account.type}`)}
                      </span>
                      <span className="text-sm font-medium">
                        <FormatAmount
                          amount={account.balance.amount}
                          currency={account.balance.currency}
                        />
                      </span>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={selectedIds.has(account.id)}
                  onCheckedChange={() => toggleAccount(account.id)}
                />
              </div>
            ))}
          </div>

          <DialogFooter className="mt-6">
            <SubmitButton
              className="w-full"
              isSubmitting={addAccountsMutation.isPending}
              disabled={
                addAccountsMutation.isPending ||
                selectedCount === 0 ||
                isLoading
              }
              onClick={handleCreate}
            >
              {selectedCount > 0
                ? `Create ${selectedCount} account${selectedCount > 1 ? "s" : ""}`
                : "Create"}
            </SubmitButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
