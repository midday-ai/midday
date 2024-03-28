"use client";

import { fetchStats } from "@/actions/fetch-stats";
import { useEffect, useState } from "react";

export function TransactionsChart() {
  const [data, setData] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const { transactions } = await fetchStats();
        setData(transactions);
      } catch {}
    }

    fetchData();
  }, []);

  return (
    <div className="flex border flex-col items-center justify-center border-border bg-background rounded-xl px-6 pt-8 pb-6 space-y-4">
      <h2 className="text-2xl">Transactions</h2>
      <p className="text-[#878787] text-sm text-center">
        We are already handling a significant amount of transaction data.
      </p>

      <div className="flex items-center space-x-4">
        <span className="relative ml-auto flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>

        <span className="mt-auto font-mono text-[80px] md:text-[122px]">
          {data &&
            Intl.NumberFormat("en", { notation: "compact" }).format(data)}
        </span>
      </div>
    </div>
  );
}
