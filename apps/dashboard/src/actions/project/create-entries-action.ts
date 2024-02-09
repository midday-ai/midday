"use server";

import { action } from "@/actions/safe-action";
import { createEntriesSchema } from "@/actions/schema";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const createEntriesAction = action(
  createEntriesSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { data, error } = await supabase
      .from("tracker_entries")
      .insert({
        ...params,
        team_id: user.data.team_id,
        // end: start + duracton in seconds
      })
      .select();

    console.log(data, error);

    revalidateTag(`tracker_projects_${user.data.team_id}`);

    return data;
  }
);
