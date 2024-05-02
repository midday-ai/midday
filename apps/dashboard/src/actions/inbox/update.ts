"use server";

import { action } from "@/actions/safe-action";
import { updateInboxSchema } from "@/actions/schema";
import { getUser } from "@midday/supabase/cached-queries";
import { updateInboxById } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const updateInboxAction = action(updateInboxSchema, async (params) => {
  const user = await getUser();
  const teamId = user?.data?.team_id;
  const supabase = createClient();

  await updateInboxById(supabase, {
    ...params,
    teamId,
  });

  revalidatePath("/inbox");
  revalidateTag(`transactions_${teamId}`);

  return null;
});
