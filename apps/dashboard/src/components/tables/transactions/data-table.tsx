"use client";

import { TransactionDetails } from "@/components/transaction-details";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
};

export function DataTable({ data }: ItemsProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleOnSelect = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="flex relative space-x-8">
      <motion.div
        className="border"
        initial={false}
        animate={{ width: collapsed ? "calc(100vw - 800px)" : "100%" }}
        transition={{
          ease: "easeInOut",
          duration: 0.25,
        }}
      >
        <DataTableHeader collapsed={collapsed} />

        {data?.map((row) => (
          <DataTableRow
            key={row.id}
            collapsed={collapsed}
            onSelect={handleOnSelect}
            data={row}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {collapsed && (
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
            <TransactionDetails />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
