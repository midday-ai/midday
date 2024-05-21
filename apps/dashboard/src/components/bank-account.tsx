"use client";

import { manualSyncTransactionsAction } from "@/actions/transactions/manual-sync-transactions-action";
import { updateBankAccountAction } from "@/actions/update-bank-account-action";
import { Switch } from "@midday/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useState } from "react";
import { EditBankAccountModal } from "./modals/edit-bank-account-modal";
import { SyncTransactions } from "./sync-transactions";

export function BankAccount({
  id,
  name,
  bank_name,
  logo,
  last_accessed,
  currency,
  enabled,
  manual,
}) {
  const [isOpen, setOpen] = useState(false);
  const [eventId, setEventId] = useState<string>();
  const [isLoading, setLoading] = useState(false);

  const updateAccount = useAction(updateBankAccountAction);

  const manualSyncTransactions = useAction(manualSyncTransactionsAction, {
    onExecute: () => setLoading(true),
    onSuccess: (data) => {
      if (data.id) {
        setEventId(data.id);
      }

      setTimeout(() => {
        // NOTE: Wait to event status is EXECUTING
        setLoading(false);
      }, 1500);
    },
  });

  return (
    <div className="flex justify-between pt-6 items-center">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex text-start items-center w-full space-x-4"
        >
          {logo && (
            <Image
              src={logo}
              alt={name}
              width={34}
              height={34}
              quality={100}
              className="rounded-full border border-1 aspect-square"
            />
          )}

          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none mb-1">{name}</p>
            <span className="text-xs font-medium text-[#606060]">
              {bank_name} ({currency})
            </span>

            {!manual && (
              <span className="text-xs text-[#606060]">
                {last_accessed
                  ? `Last accessed ${formatDistanceToNow(
                      new Date(last_accessed)
                    )} ago`
                  : "Never accessed"}
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {!manual && enabled && (
          <SyncTransactions
            eventId={eventId}
            onClick={() => manualSyncTransactions.execute({ accountId: id })}
            isLoading={isLoading}
          />
        )}

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
        defaultValue={name}
      />
    </div>
  );
}
