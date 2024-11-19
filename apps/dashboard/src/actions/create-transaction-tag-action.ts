"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createTransactionTagSchema } from "./schema";

export const createTransactionTagAction = authActionClient
  .schema(createTransactionTagSchema)
  .metadata({
    name: "create-transaction-tag",
    track: {
      event: LogEvents.CreateTransactionTag.name,
      channel: LogEvents.CreateTransactionTag.channel,
    },
  })
  .action(
    async ({
      parsedInput: { tagId, transactionId },
      ctx: { user, supabase },
    }) => {
      const { data } = await supabase.from("transaction_tags").insert({
        tag_id: tagId,
        transaction_id: transactionId,
        team_id: user.team_id!,
      });

      revalidateTag(`transactions_${user.team_id}`);

      return data;
    },
  );
