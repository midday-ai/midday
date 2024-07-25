"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateInboxSchema } from "@/actions/schema";
import { updateInboxById } from "@midday/supabase/mutations";
import { revalidatePath, revalidateTag } from "next/cache";

export const updateInboxAction = authActionClient
  .schema(updateInboxSchema)
  .metadata({
    name: "update-inbox",
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const teamId = user.team_id;

    await updateInboxById(supabase, {
      ...params,
      teamId,
    });

    revalidatePath("/inbox");
    revalidateTag(`transactions_${teamId}`);

    return null;
  });
