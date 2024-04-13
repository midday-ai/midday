"use client";

import { updateSimilarTransactionsAction } from "@/actions/update-similar-transactions-action";
import { updateTransactionAction } from "@/actions/update-transaction-action";
import { useI18n } from "@/locales/client";
import { createClient } from "@midday/supabase/client";
import { getTransactionQuery } from "@midday/supabase/queries";
import {
  getCurrentUserTeamQuery,
  getSimilarTransactions,
} from "@midday/supabase/queries";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
import { Label } from "@midday/ui/label";
import { Skeleton } from "@midday/ui/skeleton";
import { ToastAction } from "@midday/ui/toast";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { AssignUser } from "./assign-user";
import { Attachments } from "./attachments";
import { FormatAmount } from "./format-amount";
import { Note } from "./note";
import { SelectCategory } from "./select-category";
import { TransactionBankAccount } from "./transaction-bank-account";

export function TransactionDetails({ transactionId, data: initialData }) {
  const [data, setData] = useState(initialData);
  const { toast } = useToast();
  const t = useI18n();
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const updateTransaction = useAction(updateTransactionAction);
  const updateSimilarTransactions = useAction(updateSimilarTransactionsAction);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    async function fetchData() {
      try {
        const transaction = await getTransactionQuery(supabase, transactionId);
        setData(transaction);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    if (!data) {
      fetchData();
    }
  }, [data]);

  const handleOnAssign = (assigned_id: string) => {
    updateTransaction.execute({ assigned_id, id: data.id });
  };

  const handleOnChangeCategory = async (category: string) => {
    updateTransaction.execute({ id: data.id, category });

    const { data: userData } = await getCurrentUserTeamQuery(supabase);
    const transactions = await getSimilarTransactions(supabase, {
      name: data?.name,
      teamId: userData?.team_id,
    });

    if (transactions?.data?.length > 1) {
      toast({
        duration: 6000,
        variant: "ai",
        title: "Midday AI",
        description: `Do you want to mark ${
          transactions?.data?.length
        } similar transactions from ${data?.name} as ${t(
          `categories.${category}`
        )} too?`,
        footer: (
          <div className="flex space-x-2 mt-4">
            <ToastAction altText="Cancel" className="pl-5 pr-5">
              Cancel
            </ToastAction>
            <ToastAction
              altText="Yes"
              onClick={() => updateSimilarTransactions.execute({ id: data.id })}
              className="pl-5 pr-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Yes
            </ToastAction>
          </div>
        ),
      });
    }
  };

  return (
    <>
      <div className="flex justify-between mb-8">
        <div className="flex-1 flex-col">
          {isLoading ? (
            <div className="flex items-center justify-between  mt-1 mb-6">
              <div className="flex space-x-2 items-center">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="w-[100px] h-[14px] rounded-full" />
              </div>
              <Skeleton className="w-[10%] h-[14px] rounded-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {data?.bank_account?.bank_connection?.logo_url && (
                <TransactionBankAccount
                  name={data?.bank_account?.name}
                  logoUrl={data.bank_account.bank_connection.logo_url}
                  className="text-[#606060] text-xs"
                />
              )}
              <span className="text-[#606060] text-xs">
                {data?.date && format(new Date(data.date), "MMM d, y")}
              </span>
            </div>
          )}

          <h2 className="mt-6 mb-3">
            {isLoading ? (
              <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
            ) : (
              data?.name
            )}
          </h2>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span
                  className={cn(
                    "text-4xl font-mono",
                    data?.category === "income" && "text-[#00C969]"
                  )}
                >
                  <FormatAmount
                    amount={data?.amount}
                    currency={data?.currency}
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {data?.description && (
        <div className="rounded-lg border dark:bg-[#1A1A1A]/95 px-4 py-3 text-sm text-popover-foreground">
          {data.description}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
        <div>
          <Label htmlFor="category" className="mb-2 block">
            Category
          </Label>

          <SelectCategory
            placeholder="Select"
            isLoading={isLoading}
            name={data?.name}
            id={transactionId}
            selectedId={data?.category ?? undefined}
            onChange={handleOnChangeCategory}
          />
        </div>

        <div>
          <Label htmlFor="assign" className="mb-2 block">
            Assign
          </Label>

          <AssignUser
            isLoading={isLoading}
            selectedId={data?.assigned?.id ?? undefined}
            onSelect={handleOnAssign}
          />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["attachment"]}>
        <AccordionItem value="attachment">
          <AccordionTrigger>Attachment</AccordionTrigger>
          <AccordionContent>
            <Attachments id={data?.id} data={data?.attachments} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="note">
          <AccordionTrigger>Note</AccordionTrigger>
          <AccordionContent>
            <Note id={transactionId} defaultValue={data?.note} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
