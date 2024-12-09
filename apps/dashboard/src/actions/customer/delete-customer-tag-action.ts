"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "../safe-action";
import { deleteCustomerTagSchema } from "./schema";

export const deleteCustomerTagAction = authActionClient
  .schema(deleteCustomerTagSchema)
  .metadata({
    name: "delete-customer-tag",
    track: {
      event: LogEvents.DeleteCustomerTag.name,
      channel: LogEvents.DeleteCustomerTag.channel,
    },
  })
  .action(
    async ({ parsedInput: { tagId, customerId }, ctx: { user, supabase } }) => {
      const { data } = await supabase
        .from("customer_tags")
        .delete()
        .eq("customer_id", customerId)
        .eq("tag_id", tagId);

      revalidateTag(`customers_${user.team_id}`);

      return data;
    },
  );
