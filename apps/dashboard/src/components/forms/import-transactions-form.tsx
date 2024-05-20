"use client";

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
import { useForm } from "react-hook-form";

type Props = {
  defaultCurrency: string;
};

export function ImportTransactionsForm({
  currencies,
  defaultCurrency,
  transactions,
}: Props) {
  const form = useForm<CreateTransactionsFormValues>({
    resolver: zodResolver(createTransactionsSchema),
    defaultValues: {
      accountId: undefined,
      currency: defaultCurrency,
    },
  });

  const onSubmit = form.handleSubmit((data) => {});

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="flex space-x-2">
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
                <FormDescription>
                  Select or create a new account.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="h-[480px] overflow-auto mt-8 mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.internal_id} className="h-[45px]">
                  <TableCell>
                    {transaction?.date &&
                      formatTransactionDate(transaction.date)}
                  </TableCell>
                  <TableCell
                    className={transaction.amount > 0 && "text-[#00C969]"}
                  >
                    {transaction.name}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      transaction.amount > 0 && "text-[#00C969]"
                    )}
                  >
                    <FormatAmount
                      amount={transaction.amount}
                      currency={form.watch("currency")}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="w-full absolute bottom-0 left-0 h-[150px] flex flex-col justify-end pointer-events-none bg-gradient-to-b from-transparent via-background to-background">
          <Button className="w-full">Save</Button>
        </div>
      </form>
    </Form>
  );
}
