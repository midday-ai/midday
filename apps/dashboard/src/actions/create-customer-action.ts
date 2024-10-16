"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createCustomerSchema } from "./schema";

export const createCustomerAction = authActionClient
  .schema(createCustomerSchema)
  .metadata({
    name: "create-customer",
    track: {
      event: LogEvents.CreateCustomer.name,
      channel: LogEvents.CreateCustomer.channel,
    },
  })
  .action(async ({ parsedInput: input, ctx: { user, supabase } }) => {
    const { data } = await supabase
      .from("customers")
      .insert({
        ...input,
        team_id: user.team_id,
      })
      .select("id, name")
      .single();

    revalidateTag(`customers_${user.team_id}`);

    return data;
  });
