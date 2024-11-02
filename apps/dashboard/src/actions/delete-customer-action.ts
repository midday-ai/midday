"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const deleteCustomerAction = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .metadata({
    name: "delete-customer",
    track: {
      event: LogEvents.DeleteCustomer.name,
      channel: LogEvents.DeleteCustomer.channel,
    },
  })
  .action(async ({ parsedInput: input, ctx: { user, supabase } }) => {
    const { data } = await supabase
      .from("customers")
      .delete()
      .eq("id", input.id)
      .select("id");

    revalidateTag(`customers_${user.team_id}`);
    revalidateTag(`invoices_${user.team_id}`);

    return data;
  });
