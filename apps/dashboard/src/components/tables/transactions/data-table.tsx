"use client";

import { TransactionSheet } from "@/components/sheets";
import { createClient } from "@midday/supabase/client";
import { Table, TableBody } from "@midday/ui/table";
import { useQueryState } from "next-usequerystate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
  teamId?: string;
  initialTransactionId: string;
};

export function DataTable({ data, teamId, initialTransactionId }: ItemsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [transactionId, setTransactionId] = useQueryState("id", {
    defaultValue: initialTransactionId,
    shallow: false,
  });

  const selectedTransaction = data.find(
    (transaction) => transaction.id === transactionId
  );

  const setOpen = (id: string | boolean) => {
    if (id) {
      setTransactionId(id);
    } else {
      setTransactionId(null);
    }
  };

  useEffect(() => {
    const currentIndex = data.findIndex((row) => row.id === transactionId);

    const keyDownHandler = (evt: KeyboardEvent) => {
      if (transactionId && evt.key === "ArrowDown") {
        evt.preventDefault();
        const nextItem = data.at(currentIndex + 1);

        if (nextItem) {
          setTransactionId(nextItem.id);
        }
      }

      if (transactionId && evt.key === "Escape") {
        setTransactionId(null);
      }

      if (transactionId && evt.key === "ArrowUp") {
        evt.preventDefault();

        const prevItem = data.at(currentIndex - 1);

        if (currentIndex > 0 && prevItem) {
          setTransactionId(prevItem.id);
        }
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [transactionId, data, setTransactionId]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime_transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, teamId]);

  return (
    <>
      <Table>
        <DataTableHeader />

        <TableBody>
          {data.map((row) => (
            <DataTableRow row={row} key={row.id} setOpen={setOpen} />
          ))}
        </TableBody>
      </Table>

      <TransactionSheet
        isOpen={Boolean(transactionId)}
        setOpen={setOpen}
        data={selectedTransaction}
        transactionId={transactionId}
      />
    </>
  );
}
