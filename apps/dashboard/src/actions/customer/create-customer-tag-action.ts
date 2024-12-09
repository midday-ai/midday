"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "../safe-action";
import { createCustomerTagSchema } from "./schema";

export const createCustomerTagAction = authActionClient
  .schema(createCustomerTagSchema)
  .metadata({
    name: "create-customer-tag",
    track: {
      event: LogEvents.CreateCustomerTag.name,
      channel: LogEvents.CreateCustomerTag.channel,
    },
  })
  .action(
    async ({ parsedInput: { tagId, customerId }, ctx: { user, supabase } }) => {
      const { data } = await supabase.from("customer_tags").insert({
        tag_id: tagId,
        customer_id: customerId,
        team_id: user.team_id!,
      });

      revalidateTag(`customers_${user.team_id}`);

      return data;
    },
  );
