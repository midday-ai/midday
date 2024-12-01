"use client";

import { AddAccountButton } from "@/components/add-account-button";
import { FormatAmount } from "@/components/format-amount";
import { useI18n } from "@/locales/client";
import { formatAccountName } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import Image from "next/image";
import { useState } from "react";

type Props = {
  data: {
    id: string;
    name: string;
    balance: number;
    currency: string;
    logo_url?: string;
  }[];
};

export function AccountBalance({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useI18n();

  const formattedData = data.map((account) => {
    if (account.name === "total_balance") {
      return {
        ...account,
        id: account.name,
        name: t("account_balance.total_balance"),
      };
    }

    return account;
  });

  const activeAccount = formattedData.at(activeIndex);

  if (!activeAccount) {
    return (
      <div className="flex justify-center items-center h-full flex-col">
        <h2 className="font-medium mb-1">No accounts connected</h2>
        <p className="text-[#606060] text-sm mb-8 text-center">
          Get your balance in real-time by connecting <br />
          your bank account.
        </p>
        <AddAccountButton />
      </div>
    );
  }

  return (
    <div className="flex justify-between mt-12 items-center flex-col space-y-6">
      <div className="-mt-6 w-[80%] md:w-[75%] lg:w-[85%] 2xl:w-[80%] aspect-square rounded-full bg-[#F2F1EF] dark:bg-secondary flex items-center justify-center p-8 flex-col space-y-2">
        <h2 className="font-mono font-medium text-2xl">
          <FormatAmount
            amount={activeAccount.balance}
            currency={activeAccount.currency}
          />
        </h2>

        <div className="flex space-x-2 items-center">
          {activeAccount?.logo_url && (
            <Image
              src={activeAccount.logo_url}
              alt=""
              width={24}
              height={24}
              quality={100}
              className="rounded-full border border-1 aspect-square"
            />
          )}

          <span className="text-xs font-medium text-[#606060]">
            {formatAccountName({
              name: activeAccount.name,
              currency: activeAccount.currency,
            })}
          </span>
        </div>
      </div>

      {formattedData.length > 1 && (
        <div className="flex space-x-2">
          {formattedData.map((account, idx) => (
            <button
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => setActiveIndex(idx)}
              key={account.id}
              className={cn(
                "w-[8px] h-[8px] rounded-full bg-[#1D1D1D] dark:bg-[#D9D9D9] opacity-30 transition-all cursor-pointer",
                idx === activeIndex && "opacity-1",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
