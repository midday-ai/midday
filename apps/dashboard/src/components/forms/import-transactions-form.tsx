"use client";

import { createTransactionsAction } from "@/actions/create-transactions-action";
import {
  type CreateTransactionsFormValues,
  createTransactionsSchema,
} from "@/actions/schema";
import { FormatAmount } from "@/components/format-amount";
import { SelectAccount } from "@/components/select-account";
import { SelectCurrency } from "@/components/select-currency";
import { formatTransactionDate } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type Props = {
  defaultCurrency: string;
};

export function ImportTransactionsForm({
  currencies,
  defaultCurrency,
  transactions,
}: Props) {
  const [_, setStep] = useQueryState("step");

  const createTransactions = useAction(createTransactionsAction, {
    onSuccess: () => setStep(null),
  });
  const form = useForm<CreateTransactionsFormValues>({
    resolver: zodResolver(createTransactionsSchema),
    defaultValues: {
      accountId: undefined,
      currency: defaultCurrency,
      transactions: [],
    },
  });

  const selectedCurrency = form.watch("currency");
  const selectedAccountId = form.watch("accountId");
  const isSaving = createTransactions.status === "executing";

  useEffect(() => {
    const formattedTransactions = transactions?.map(
      ({ category, ...transaction }) => ({
        ...transaction,
        currency: selectedCurrency,
        bank_account_id: selectedAccountId,
        category_slug: category,
      })
    );

    form.setValue("transactions", formattedTransactions);
  }, [selectedAccountId, selectedCurrency]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(createTransactions.execute)}
        className="relative"
      >
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <SelectAccount
                  className="w-full"
                  placeholder="Select account"
                  {...field}
                />
              </FormControl>
              <FormDescription>Select or create a new account.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!selectedCurrency && (
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <SelectCurrency
                    className="w-full"
                    {...field}
                    currencies={Object.values(currencies)?.map(
                      (currency) => currency
                    )}
                  />
                </FormControl>
                <FormDescription>
                  Select the currency for your transactions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="h-[480px] overflow-auto mt-8 mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Date</TableHead>
                <TableHead className="w-[250px]">Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow
                  key={transaction.internal_id}
                  className="h-[45px] hover:bg-transparent"
                >
                  <TableCell>
                    {transaction?.date &&
                      formatTransactionDate(transaction.date)}
                  </TableCell>
                  <TableCell
                    className={cn(transaction.amount > 0 && "text-[#00C969]")}
                  >
                    <span className="line-clamp-1">{transaction.name}</span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      transaction.amount > 0 && "text-[#00C969]"
                    )}
                  >
                    <FormatAmount
                      amount={transaction.amount}
                      currency={selectedCurrency}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="w-full absolute z-50 bottom-0 left-0 h-[150px] flex flex-col justify-end bg-gradient-to-b from-transparent via-background to-background">
          <Button className="w-full z-20" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
