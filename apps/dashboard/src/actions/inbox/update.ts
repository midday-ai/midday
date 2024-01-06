"use server";

import { action } from "@/actions/safe-action";
import { updateInboxSchema } from "@/actions/schema";
import { updateInboxById } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateInboxAction = action(updateInboxSchema, async (params) => {
  const supabase = createClient();
  const { data } = await updateInboxById(supabase, params);

  revalidateTag(`inbox_${data.team_id}`);

  return data;
});
