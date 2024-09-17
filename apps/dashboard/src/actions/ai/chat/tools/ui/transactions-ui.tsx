"use client";

import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { TransactionStatus } from "@/components/transaction-status";
import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { ShowAllButton } from "./show-all-button";

type Props = {
  meta: any;
  data: any;
  q: string;
  filter: Record<string, string>;
};

export function TransactionsUI({ meta, data, q, filter }: Props) {
  const t = useI18n();

  if (!meta.count) {
    return (
      <BotCard>
        No transactions were found for your request. Please try a different
        message.
      </BotCard>
    );
  }

  return (
    <BotCard className="space-y-4">
      {meta.totalAmount.length === 1 && (
        <p>
          We found {meta.count}{" "}
          {filter.recurring ? "recurring transactions" : "transactions"} with a
          total amount of{" "}
          <FormatAmount
            amount={meta.totalAmount.at(0).amount}
            currency={meta.totalAmount.at(0).currency}
          />
        </p>
      )}

      {meta.totalAmount.length > 1 && (
        <p>We found {meta.count} transactions </p>
      )}

      {meta.count > 0 && (
        <Table className="text-xs font-sans">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%] h-10">Description</TableHead>
              <TableHead className="h-10">Amount</TableHead>
              <TableHead className="h-10 text-right w-[50px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((transaction) => {
              const fullfilled =
                transaction.status === "completed" ||
                transaction?.attachments?.length > 0;

              return (
                <TableRow key={transaction.id} className="h-[34px]">
                  <TableCell
                    className={cn(
                      "font-normal flex items-center space-x-2",
                      transaction.category?.slug === "income" &&
                        "text-[#00C969]",
                    )}
                  >
                    <span className="line-clamp-1">{transaction.name}</span>
                    {transaction.recurring && (
                      <TooltipProvider delayDuration={20}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Icons.Repeat className="text-[#878787]" />
                          </TooltipTrigger>
                          <TooltipContent
                            className="px-3 py-1.5 text-xs"
                            side="right"
                            sideOffset={10}
                          >
                            <span>
                              {t(
                                `transaction_frequency.${transaction.frequency}`,
                              )}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-normal",
                      transaction.category?.slug === "income" &&
                        "text-[#00C969]",
                    )}
                  >
                    <FormatAmount
                      amount={transaction.amount}
                      currency={transaction.currency}
                    />
                  </TableCell>
                  <TableCell className="text-right font-normal">
                    <TransactionStatus fullfilled={fullfilled} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {meta.count > 5 && <ShowAllButton filter={filter} q={q} />}
    </BotCard>
  );
}
