"use server";

import { action } from "@/actions/safe-action";
import { updateEntriesSchema } from "@/actions/schema";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateEntriesAction = action(
  updateEntriesSchema,
  async (params) => {
    // const supabase = createClient();
    // const user = await getUser();
    // await supabase.from("tracker_projects").delete().eq("id", params.id);
    // revalidateTag(`tracker_projects_${user.data.team_id}`);

    const supabase = createClient();
    const user = await getUser();

    const { data, error } = await supabase
      .from("tracker_entries")
      .upsert({
        ...params,
        team_id: user.data.team_id,
      })
      .select();

    console.log(data, error);

    revalidateTag(`tracker_projects_${user.data.team_id}`);

    return data;
  }
);
