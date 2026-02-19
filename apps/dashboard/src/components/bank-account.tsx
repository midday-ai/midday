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
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, MoreHorizontal } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { FormatAmount } from "./format-amount";
import { EditBankAccountModal } from "./modals/edit-bank-account-modal";

type Props = {
  data: NonNullable<
    RouterOutputs["bankConnections"]["get"]
  >[number]["bankAccounts"][number];
  provider?: string | null;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast({
          duration: 2000,
          title: `${label} copied to clipboard`,
        });
      }}
    >
      <Icons.Copy className="size-3" />
    </Button>
  );
}

function MaskedValue({
  value,
  revealed,
  maskLength = 4,
}: {
  value: string;
  revealed: boolean;
  maskLength?: number;
}) {
  if (revealed) {
    return <span className="font-mono text-xs">{value}</span>;
  }

  const last4 = value.slice(-maskLength);
  return (
    <span className="font-mono text-xs">
      {"•".repeat(Math.max(0, value.length - maskLength))}
      {last4}
    </span>
  );
}

export function BankAccount({ data, provider }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [deleteValue, setDeleteValue] = useState("");
  const [isEditOpen, setEditOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const t = useI18n();
  const { toast } = useToast();

  const [_, setParams] = useQueryStates({
    step: parseAsString,
    accountId: parseAsString,
    hide: parseAsBoolean,
    type: parseAsString,
  });

  const {
    id,
    enabled,
    manual,
    type,
    name,
    balance,
    currency,
    subtype,
    bic,
    routingNumber,
    wireRoutingNumber,
    sortCode,
    availableBalance,
    creditLimit,
  } = data;

  // Determine if this is a US or EU account based on provider
  const isUSAccount = provider === "teller" || provider === "plaid";
  const isEUAccount = provider === "gocardless" || provider === "enablebanking";
  const isCreditAccount = type === "credit";

  // Fetch decrypted details only when user wants to reveal
  const { data: details, isLoading: isLoadingDetails } = useQuery({
    ...trpc.bankAccounts.getDetails.queryOptions({ id }),
    enabled: showSensitive,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const deleteAccountMutation = useMutation(
    trpc.bankAccounts.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bankAccounts.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bankConnections.get.queryKey(),
        });
        setDeleteValue("");
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

  const hasRoutingInfo = routingNumber || wireRoutingNumber || sortCode;
  const hasIbanOrAccountNumber = details?.iban || details?.accountNumber;

  return (
    <div
      className={cn(
        "border border-border p-4 flex flex-col gap-3 h-full",
        !enabled && "opacity-60",
      )}
    >
      {/* Header: Name, Actions, Toggle */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">{name}</p>
          <span className="text-xs text-[#878787] capitalize">
            {/* @ts-expect-error */}
            {t(`account_type.${type}`)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
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
                  Backfill
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <AlertDialogTrigger className="w-full text-left">
                    Delete
                  </AlertDialogTrigger>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to delete a bank account. If you proceed, all
                  transactions associated with this account will also be
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex flex-col gap-2 mt-2">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-medium">DELETE</span> to confirm.
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteValue}
                  onChange={(e) => setDeleteValue(e.target.value)}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteValue !== "DELETE"}
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
      </div>

      {/* Balance Section */}
      <div className="flex flex-col gap-1">
        {balance !== null && balance !== undefined && currency ? (
          <>
            <div className="flex items-baseline gap-2">
              {isCreditAccount && (
                <span className="text-xs text-[#878787]">Owed</span>
              )}
              <span className="text-lg font-medium">
                <FormatAmount amount={balance} currency={currency} />
              </span>
            </div>
            {isCreditAccount &&
              (availableBalance !== null || creditLimit !== null) && (
                <div className="flex items-center gap-2 text-xs text-[#878787]">
                  {availableBalance !== null && (
                    <span>
                      Available:{" "}
                      <FormatAmount
                        amount={availableBalance}
                        currency={currency}
                      />
                    </span>
                  )}
                  {availableBalance !== null && creditLimit !== null && (
                    <span>·</span>
                  )}
                  {creditLimit !== null && (
                    <span>
                      Limit:{" "}
                      <FormatAmount amount={creditLimit} currency={currency} />
                    </span>
                  )}
                </div>
              )}
          </>
        ) : null}
      </div>

      {/* Bank Details Section */}
      {(hasRoutingInfo || bic || (showSensitive && hasIbanOrAccountNumber)) && (
        <div className="border-t border-border pt-3 mt-1">
          <div className="flex flex-col gap-2 text-sm">
            {/* US Account Details */}
            {isUSAccount && (
              <>
                {routingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#878787]">Routing</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{routingNumber}</span>
                      <CopyButton
                        value={routingNumber}
                        label="Routing number"
                      />
                    </div>
                  </div>
                )}
                {wireRoutingNumber && wireRoutingNumber !== routingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#878787]">Wire</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">
                        {wireRoutingNumber}
                      </span>
                      <CopyButton
                        value={wireRoutingNumber}
                        label="Wire routing number"
                      />
                    </div>
                  </div>
                )}
                {(hasRoutingInfo || details?.accountNumber) && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#878787]">Account</span>
                    <div className="flex items-center gap-1">
                      {isLoadingDetails ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : details?.accountNumber ? (
                        <>
                          <MaskedValue
                            value={details.accountNumber}
                            revealed={showSensitive}
                          />
                          <CopyButton
                            value={details.accountNumber}
                            label="Account number"
                          />
                        </>
                      ) : (
                        <span className="text-xs text-[#878787]">—</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setShowSensitive(!showSensitive)}
                      >
                        {showSensitive ? (
                          <EyeOff className="size-3" />
                        ) : (
                          <Eye className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* UK Sort Code */}
            {sortCode && (
              <div className="flex items-center justify-between">
                <span className="text-[#878787]">Sort Code</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">{sortCode}</span>
                  <CopyButton value={sortCode} label="Sort code" />
                </div>
              </div>
            )}

            {/* EU Account Details - IBAN */}
            {isEUAccount && (bic || details?.iban) && (
              <div className="flex items-center justify-between">
                <span className="text-[#878787]">IBAN</span>
                <div className="flex items-center gap-1">
                  {isLoadingDetails ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : details?.iban ? (
                    <>
                      <MaskedValue
                        value={details.iban}
                        revealed={showSensitive}
                      />
                      <CopyButton value={details.iban} label="IBAN" />
                    </>
                  ) : (
                    <span className="text-xs text-[#878787]">—</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setShowSensitive(!showSensitive)}
                  >
                    {showSensitive ? (
                      <EyeOff className="size-3" />
                    ) : (
                      <Eye className="size-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* EU Account Details - BIC */}
            {bic && (
              <div className="flex items-center justify-between">
                <span className="text-[#878787]">BIC</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">{bic}</span>
                  <CopyButton value={bic} label="BIC" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <EditBankAccountModal
        id={id}
        onOpenChange={setEditOpen}
        isOpen={isEditOpen}
        defaultName={name}
        defaultType={type}
        defaultBalance={balance}
      />
    </div>
  );
}
