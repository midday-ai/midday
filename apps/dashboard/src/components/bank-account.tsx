"use client";

import { updateBankAccountAction } from "@/actions/update-bank-account-action";
import { Switch } from "@midday/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useState } from "react";
import { EditBankAccountModal } from "./modals/edit-bank-account-modal";

export function BankAccount({
  id,
  name,
  bank_name,
  logo,
  last_accessed,
  currency,
  enabled,
}) {
  const [isOpen, setOpen] = useState(false);
  const updateAccount = useAction(updateBankAccountAction);

  return (
    <div className="flex justify-between pt-6 items-center">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex text-start items-center w-full"
        >
          {logo && (
            <Image
              src={logo}
              alt={name}
              width={34}
              height={34}
              className="rounded-full"
            />
          )}

          <div className="ml-4 flex flex-col">
            <p className="text-sm font-medium leading-none mb-1">{name}</p>
            <span className="text-xs font-medium text-[#606060]">
              {bank_name} ({currency})
            </span>

            <span className="text-xs text-[#606060]">
              {last_accessed
                ? `Last accessed ${formatDistanceToNow(
                    new Date(last_accessed)
                  )} ago`
                : "Never accessed"}
            </span>
          </div>
        </button>
      </div>

      <Switch
        checked={enabled}
        disabled={updateAccount.status === "executing"}
        onCheckedChange={(enabled: boolean) => {
          updateAccount.execute({ id, enabled });
        }}
      />

      <EditBankAccountModal
        id={id}
        onOpenChange={setOpen}
        isOpen={isOpen}
        defaultValue={name}
      />
    </div>
  );
}
