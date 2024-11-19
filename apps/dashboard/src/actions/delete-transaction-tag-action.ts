"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteTransactionTagSchema } from "./schema";

export const deleteTransactionTagAction = authActionClient
  .schema(deleteTransactionTagSchema)
  .metadata({
    name: "delete-transaction-tag",
    track: {
      event: LogEvents.DeleteTransactionTag.name,
      channel: LogEvents.DeleteTransactionTag.channel,
    },
  })
  .action(
    async ({
      parsedInput: { tagId, transactionId },
      ctx: { user, supabase },
    }) => {
      const { data } = await supabase
        .from("transaction_tags")
        .delete()
        .eq("transaction_id", transactionId)
        .eq("tag_id", tagId);

      revalidateTag(`transactions_${user.team_id}`);

      return data;
    },
  );
