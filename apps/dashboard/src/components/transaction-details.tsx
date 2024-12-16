import { createAttachmentsAction } from "@/actions/create-attachments-action";
import { createTransactionTagAction } from "@/actions/create-transaction-tag-action";
import { deleteTransactionTagAction } from "@/actions/delete-transaction-tag-action";
import type { UpdateTransactionValues } from "@/actions/schema";
import { updateSimilarTransactionsCategoryAction } from "@/actions/update-similar-transactions-action";
import { updateSimilarTransactionsRecurringAction } from "@/actions/update-similar-transactions-recurring";
import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { getTransactionQuery } from "@midday/supabase/queries";
import { getSimilarTransactions } from "@midday/supabase/queries";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { Switch } from "@midday/ui/switch";
import { ToastAction } from "@midday/ui/toast";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AssignUser } from "./assign-user";
import { Attachments } from "./attachments";
import { FormatAmount } from "./format-amount";
import { Note } from "./note";
import { SelectCategory } from "./select-category";
import { SelectTags } from "./select-tags";
import { TransactionBankAccount } from "./transaction-bank-account";

type Props = {
  data: any;
  ids?: string[];
  updateTransaction: (
    values: UpdateTransactionValues,
    optimisticData: any,
  ) => void;
};

export function TransactionDetails({
  data: initialData,
  ids,
  updateTransaction,
}: Props) {
  const [data, setData] = useState(initialData);
  const [transactionId, setTransactionId] = useQueryState("id");
  const { toast } = useToast();
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const updateSimilarTransactionsCategory = useAction(
    updateSimilarTransactionsCategoryAction,
  );
  const updateSimilarTransactionsRecurring = useAction(
    updateSimilarTransactionsRecurringAction,
  );
  const createAttachments = useAction(createAttachmentsAction);
  const createTransactionTag = useAction(createTransactionTagAction);
  const deleteTransactionTag = useAction(deleteTransactionTagAction);

  const { team_id: teamId } = useUserContext((state) => state.data);

  useHotkeys("esc", () => setTransactionId(null));

  const enabled = Boolean(ids?.length);

  useHotkeys(
    "ArrowUp, ArrowDown",
    ({ key }) => {
      if (key === "ArrowUp") {
        const currentIndex = ids?.indexOf(data?.id) ?? 0;
        const prevId = ids[currentIndex - 1];

        if (prevId) {
          setTransactionId(prevId);
        }
      }

      if (key === "ArrowDown") {
        const currentIndex = ids?.indexOf(data?.id) ?? 0;
        const nextId = ids[currentIndex + 1];

        if (nextId) {
          setTransactionId(nextId);
        }
      }
    },
    { enabled },
  );

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    async function fetchData() {
      try {
        const transaction = await getTransactionQuery(supabase, data?.id);
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

  const handleOnChangeCategory = async (category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }) => {
    updateTransaction(
      { id: data?.id, category_slug: category.slug },
      { category },
    );

    const transactions = await getSimilarTransactions(supabase, {
      name: data?.name,
      teamId: teamId,
    });

    if (transactions?.data && transactions.data.length > 1) {
      toast({
        duration: 6000,
        variant: "ai",
        title: "Midday AI",
        description: `Do you want to mark ${transactions?.data?.length} similar transactions from ${data?.name} as ${category.name} too?`,
        footer: (
          <div className="flex space-x-2 mt-4">
            <ToastAction altText="Cancel" className="pl-5 pr-5">
              Cancel
            </ToastAction>
            <ToastAction
              altText="Yes"
              onClick={() => {
                updateSimilarTransactionsCategory.execute({ id: data?.id });
              }}
              className="pl-5 pr-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Yes
            </ToastAction>
          </div>
        ),
      });
    }
  };

  const handleOnChangeRecurring = async (value: boolean) => {
    updateTransaction(
      { id: data?.id, recurring: value, frequency: value ? "monthly" : null },
      { recurring: value, frequency: value ? "monthly" : null },
    );

    const transactions = await getSimilarTransactions(supabase, {
      name: data?.name,
      teamId: teamId,
    });

    if (transactions?.data && transactions.data.length > 1) {
      toast({
        duration: 6000,
        variant: "ai",
        title: "Midday AI",
        description: `Do you want to mark ${transactions?.data?.length} similar transactions from ${data?.name} as ${value ? "Recurring" : "Non Recurring"} too?`,
        footer: (
          <div className="flex space-x-2 mt-4">
            <ToastAction altText="Cancel" className="pl-5 pr-5">
              Cancel
            </ToastAction>
            <ToastAction
              altText="Yes"
              onClick={() => {
                updateSimilarTransactionsRecurring.execute({ id: data?.id });
              }}
              className="pl-5 pr-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Yes
            </ToastAction>
          </div>
        ),
      });
    }
  };

  const defaultValue = ["attachment"];

  if (data?.note) {
    defaultValue.push("note");
  }

  return (
    <div className="h-[calc(100vh-80px)] scrollbar-hide overflow-auto">
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
              <span className="text-[#606060] text-xs select-text">
                {data?.date && format(new Date(data.date), "MMM d, y")}
              </span>
            </div>
          )}

          <h2 className="mt-6 mb-3 select-text">
            {isLoading ? (
              <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
            ) : (
              data?.name
            )}
          </h2>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full space-y-1">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span
                  className={cn(
                    "text-4xl font-mono select-text",
                    data?.category?.slug === "income" && "text-[#00C969]",
                  )}
                >
                  <FormatAmount
                    amount={data?.amount}
                    currency={data?.currency}
                  />
                </span>
              )}
              <div className="h-3">
                {data?.vat > 0 && (
                  <span className="text-[#606060] text-xs select-text">
                    VAT{" "}
                    <FormatAmount amount={data.vat} currency={data.currency} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {data?.description && (
        <div className="border dark:bg-[#1A1A1A]/95 px-4 py-3 text-sm text-popover-foreground select-text">
          {data.description}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
        <div>
          <Label htmlFor="category" className="mb-2 block">
            Category
          </Label>

          <SelectCategory
            id={transactionId}
            selected={data?.category}
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
            onSelect={(user) => {
              updateTransaction(
                { assigned_id: user?.id, id: data?.id },
                { assigned: user },
              );
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="tags" className="mb-2 block">
          Tags
        </Label>

        <SelectTags
          tags={data?.tags?.map((tag) => ({
            label: tag.tag.name,
            value: tag.tag.name,
            id: tag.tag.id,
          }))}
          onSelect={(tag) => {
            createTransactionTag.execute({
              tagId: tag.id,
              transactionId: data?.id,
            });
          }}
          onRemove={(tag) => {
            deleteTransactionTag.execute({
              tagId: tag.id,
              transactionId: data?.id,
            });
          }}
        />
      </div>

      <Accordion type="multiple" defaultValue={defaultValue}>
        <AccordionItem value="attachment">
          <AccordionTrigger>Attachment</AccordionTrigger>
          <AccordionContent className="select-text">
            <Attachments
              prefix={data?.id}
              data={data?.attachments}
              onUpload={(files) => {
                if (files) {
                  createAttachments.execute(
                    files.map((file) => ({
                      ...file,
                      transaction_id: data?.id,
                    })),
                  );
                }
              }}
            />
          </AccordionContent>
        </AccordionItem>

        <div className="mt-6 mb-4">
          <Label htmlFor="settings" className="mb-2 block font-medium text-md">
            Exclude from analytics
          </Label>
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs text-muted-foreground">
                Exclude this transaction from analytics like profit, expense and
                revenue. This is useful for internal transfers between accounts
                to avoid double-counting.
              </p>
            </div>

            <Switch
              checked={data?.internal}
              onCheckedChange={() => {
                updateTransaction(
                  { id: data?.id, internal: !data?.internal },
                  { internal: !data?.internal },
                );
              }}
            />
          </div>
        </div>

        <AccordionItem value="recurring">
          <AccordionTrigger>Recurring</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Mark as recurring. Similar future transactions will be
                  automatically categorized and flagged as recurring.
                </p>
              </div>
              <Switch
                checked={data?.recurring}
                onCheckedChange={handleOnChangeRecurring}
              />
            </div>

            {data?.recurring && (
              <Select
                value={data?.frequency}
                onValueChange={(value) => {
                  updateTransaction(
                    { id: data?.id, frequency: value },
                    { frequency: value },
                  );

                  updateSimilarTransactionsRecurring.execute({ id: data?.id });
                }}
              >
                <SelectTrigger className="w-full mt-4">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[
                      { id: "weekly", name: "Weekly" },
                      { id: "monthly", name: "Monthly" },
                      { id: "annually", name: "Annually" },
                    ].map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="note">
          <AccordionTrigger>Note</AccordionTrigger>
          <AccordionContent className="select-text">
            <Note
              id={data?.id}
              defaultValue={data?.note}
              updateTransaction={updateTransaction}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
