"use client";

import { TransactionDetails } from "@/components/transaction-details";
import { createClient } from "@midday/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
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
};

export function DataTable({ data, teamId }: ItemsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [transactionId, setTransactionId] = useQueryState("id", {
    shallow: false, // TODO: Fix without this (redirect after mutation)
  });

  const selectedTransaction = data.find(
    (transaction) => transaction.id === transactionId
  );

  const handleOnSelect = (id: string) => {
    setTransactionId(id);
  };

  const handleOnClose = () => {
    setTransactionId(null);
  };

  useEffect(() => {
    const currentIndex = data.findIndex((row) => row.id === transactionId);

    const keyDownHandler = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        evt.preventDefault();

        handleOnClose();
      }

      if (transactionId && evt.key === "ArrowDown") {
        evt.preventDefault();
        const nextItem = data.at(currentIndex + 1);

        if (nextItem) {
          setTransactionId(nextItem.id);
        }
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
  }, [handleOnClose, transactionId, data, setTransactionId]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime_transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
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
    <div className="flex relative space-x-8 cursor-default">
      <motion.div
        className="border"
        initial={false}
        animate={{
          width: transactionId ? "calc(100vw - var(--sidebar-width))" : "100%",
        }}
        transition={{
          ease: "easeInOut",
          duration: 0.25,
        }}
      >
        <DataTableHeader collapsed={Boolean(transactionId)} />

        {data?.map((row) => (
          <DataTableRow
            key={row.id}
            collapsed={Boolean(transactionId)}
            onSelect={handleOnSelect}
            data={row}
            selected={row.id === transactionId}
          />
        ))}
      </motion.div>

      <AnimatePresence initial={false}>
        {transactionId && (
          <motion.div
            className="h-full w-[480px] absolute top-0 right-0 bottom-0"
            initial={{
              y: 400,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 0.15, delay: 0.1 },
            }}
            exit={{
              y: 400,
              opacity: 0,
              transition: { duration: 0.1, delay: 0 },
            }}
          >
            <TransactionDetails
              transactionId={transactionId}
              onClose={handleOnClose}
              data={selectedTransaction}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
