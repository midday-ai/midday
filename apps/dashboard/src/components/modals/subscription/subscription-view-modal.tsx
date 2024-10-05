"use client";

import { TransactionAnalytics } from "@/components/bank-account/transaction-analytics";
import { FeatureInDevelopment } from "@/components/feature-in-development";
import { useSubscriptionViewStore } from "@/store/subscription-view";
import { formatTransactionDate } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import {
  getRecentTransactionsQuery,
  getUserQuery,
  RecurringTransactionFrequency,
} from "@midday/supabase/queries";
import { TransactionSchema } from "@midday/supabase/types";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { Skeleton } from "@midday/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { Table } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const TransactionSkeleton = () => (
  <div className="flex flex-col gap-4 md:p-[2.5%] w-full">
    <Skeleton className="h-8 w-1/3" /> {/* Title skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" /> {/* Description skeleton */}
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="border rounded-md">
      {/* Table header */}
      <div className="flex border-b p-2">
        <Skeleton className="h-6 w-1/4 mr-2" />
        <Skeleton className="h-6 w-1/4 mr-2" />
        <Skeleton className="h-6 w-1/4 mr-2" />
        <Skeleton className="h-6 w-1/4" />
      </div>
      {/* Table rows */}
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex border-b p-2">
          <Skeleton className="h-4 w-1/4 mr-2" />
          <Skeleton className="h-4 w-1/4 mr-2" />
          <Skeleton className="h-4 w-1/4 mr-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  </div>
);

export function SubscriptionViewModal() {
  const { isOpen, setOpen } = useSubscriptionViewStore();
  const supabase = useMemo(() => createClient(), []);
  const [transactionData, setTransactionData] = useState<
    TransactionSchema[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  useHotkeys("meta+s", () => setOpen(true), {
    enableOnFormTags: true,
  });

  const fetchTransactionData = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data: userData } = await getUserQuery(
        supabase,
        session?.user?.id ?? "",
      );

      const result = await getRecentTransactionsQuery(supabase, {
        teamId: userData?.team_id ?? "",
        recurring: RecurringTransactionFrequency.MONTHLY,
        limit: 10,
      });

      if (result.data) {
        setTransactionData(result.data);
      } else {
        setTransactionData(null);
      }
    } catch (error) {
      console.error("Error fetching transaction data:", error);
      setTransactionData(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isOpen && !transactionData && !isLoading) {
      fetchTransactionData();
    }
  }, [isOpen, fetchTransactionData, transactionData, isLoading]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (!open) {
        setTransactionData(null);
      }
    },
    [setOpen],
  );
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 max-w-full w-full h-full md:min-h-[70%] md:max-h-[75%] md:min-w-[70%] md:max-w-[75%] m-0 rounded-2xl"
        hideClose
      >
        <ModalContent data={transactionData} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}

const ModalContent = React.memo<{
  data: TransactionSchema[] | null;
  isLoading: boolean;
}>(({ data, isLoading }) => {
  if (isLoading) {
    return <TransactionSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="w-full md:p-[5%] overflow-y-auto scrollbar-hide">
      <CardHeader>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-3xl font-bold">
              Recent Subscriptions
            </CardTitle>
            <CardDescription>
              View and manage your recent subscriptions
            </CardDescription>
          </div>
          <TransactionAnalytics transactions={data} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction, index) => (
              <TableRow key={transaction.id || index}>
                <TableCell>{formatTransactionDate(transaction.date)}</TableCell>
                <TableCell>
                  {transaction.description ?? transaction.name}
                </TableCell>
                <TableCell>{transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.account_owner}</TableCell>
                <TableCell>{transaction.method}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </div>
  );
});
