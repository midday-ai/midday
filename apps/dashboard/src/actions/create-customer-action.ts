"use server";

import { LogEvents } from "@midday/events/events";
import { generateToken } from "@midday/invoice/token";
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
  .action(
    async ({ parsedInput: { tags, ...input }, ctx: { user, supabase } }) => {
      const token = await generateToken(user.id);

      const { data } = await supabase
        .from("customers")
        .upsert(
          {
            ...input,
            token,
            team_id: user.team_id,
          },
          {
            onConflict: "id",
          },
        )
        .select("id, name")
        .single();

      if (tags?.length) {
        await supabase.from("customer_tags").insert(
          tags.map((tag) => ({
            tag_id: tag.id,
            customer_id: data?.id,
            team_id: user.team_id!,
          })),
        );
      }

      revalidateTag(`customers_${user.team_id}`);

      return data;
    },
  );
