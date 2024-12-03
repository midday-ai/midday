// import type { Transaction } from "@midday/import/src/types";
// import { revalidateTag } from "next/cache";
// import { z } from "zod";
// import { processBatch } from "./process";

// const BATCH_LIMIT = 500;

// export const createTransactionSchema = z.object({
//   name: z.string(),
//   currency: z.string(),
//   bank_account_id: z.string(),
//   team_id: z.string(),
//   internal_id: z.string(),
//   status: z.enum(["posted", "pending"]),
//   method: z.enum(["card", "bank", "other"]),
//   date: z.coerce.date(),
//   amount: z.number(),
//   manual: z.boolean(),
//   category_slug: z.string().nullable(),
// });

// export const processTransactions = async ({
//   transactions,
//   io,
//   supabase,
//   teamId,
// }) => {
//   const processedTransactions = transactions.map((transaction) =>
//     createTransactionSchema.safeParse(transaction),
//   );

//   const validTransactions = processedTransactions.filter(
//     (transaction) => transaction.success,
//   );

//   const invalidTransactions = processedTransactions.filter(
//     (transaction) => !transaction.success,
//   );

//   if (invalidTransactions.length > 0) {
//     await io.logger.error("Invalid transactions", {
//       invalidTransactions,
//     });

//     throw new Error("Invalid transactions");
//   }

//   if (validTransactions.length > 0) {
//     await processBatch(
//       validTransactions.map(({ data }) => data),
//       BATCH_LIMIT,
//       async (batch) => {
//         await supabase.from("transactions").upsert(batch, {
//           onConflict: "internal_id",
//           ignoreDuplicates: true,
//         });
//       },
//     );

//     revalidateTag(`bank_connections_${teamId}`);
//     revalidateTag(`transactions_${teamId}`);
//     revalidateTag(`spending_${teamId}`);
//     revalidateTag(`metrics_${teamId}`);
//     revalidateTag(`bank_accounts_${teamId}`);
//     revalidateTag(`insights_${teamId}`);
//   }
// };

// export const mapTransactions = (
//   data: Record<string, string>[],
//   mappings: Record<string, string>,
//   currency: string,
//   teamId: string,
//   bankAccountId: string,
// ): Transaction[] => {
//   return data.map((row) => ({
//     ...(Object.fromEntries(
//       Object.entries(mappings)
//         .filter(([_, value]) => value !== "")
//         .map(([key, value]) => [key, row[value]]),
//     ) as Transaction),
//     currency,
//     teamId,
//     bankAccountId,
//   }));
// };
