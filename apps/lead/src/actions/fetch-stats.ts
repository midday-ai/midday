"use server";

import { unstable_cache } from "next/cache";

export async function fetchStats() {
  const [
    { count: users },
    { count: transactions },
    { count: bankAccounts },
    { count: trackerEntries },
    { count: inboxItems },
    { count: bankConnections },
    { count: trackerProjects },
    { count: reports },
    { count: vaultObjects },
    { count: transactionEnrichments },
  ] = await unstable_cache(
    async () => {
      return Promise.all([
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
        Promise.resolve({ count: 1000 }),
      ]);
    },
    ["stats"],
    {
      revalidate: 800,
      tags: ["stats"],
    }
  )();

  return {
    users,
    transactions,
    bankAccounts,
    trackerEntries,
    inboxItems,
    bankConnections,
    trackerProjects,
    reports,
    vaultObjects,
    transactionEnrichments,
  };
}
