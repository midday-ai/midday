"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateInboxSchema } from "@/actions/schema";
import { updateInboxById } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const updateInboxAction = authActionClient
  .schema(updateInboxSchema)
  .action(async ({ parsedInput: params, ctx: { user } }) => {
    const teamId = user.team_id;
    const supabase = createClient();

    await updateInboxById(supabase, {
      ...params,
      teamId,
    });

    revalidatePath("/inbox");
    revalidateTag(`transactions_${teamId}`);

    return null;
  });
