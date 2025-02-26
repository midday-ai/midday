"use server";

import { LogEvents } from "@midday/events/events";
import { deleteConnection } from "jobs/tasks/bank/delete/delete-connection";
import { revalidateTag } from "next/cache";
import { authActionClient } from "../safe-action";
import { deleteConnectionSchema } from "../schema";

export const deleteConnectionAction = authActionClient
  .schema(deleteConnectionSchema)
  .metadata({
    name: "delete-connection",
    track: {
      event: LogEvents.DeleteConnection.name,
      channel: LogEvents.DeleteConnection.channel,
    },
  })
  .action(
    async ({ parsedInput: { connectionId }, ctx: { supabase, user } }) => {
      const { data, error } = await supabase
        .from("bank_connections")
        .delete()
        .eq("id", connectionId)
        .select("reference_id, provider, access_token")
        .single();

      revalidateTag(`bank_accounts_${user.team_id}`);
      revalidateTag(`bank_accounts_currencies_${user.team_id}`);
      revalidateTag(`bank_connections_${user.team_id}`);
      revalidateTag(`transactions_${user.team_id}`);

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.provider) {
        return;
      }

      const event = await deleteConnection.trigger({
        referenceId: data.reference_id,
        provider: data.provider,
        accessToken: data.access_token,
      });

      return data;
    },
  );
