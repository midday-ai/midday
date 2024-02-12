"use server";

import { action } from "@/actions/safe-action";
import { updateEntriesSchema } from "@/actions/schema";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateEntriesAction = action(
  updateEntriesSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { action, ...payload } = params;

    if (action === "delete") {
      await supabase.from("tracker_entries").delete().eq("id", params.id);
      revalidateTag(`tracker_projects_${user.data.team_id}`);

      return Promise.resolve(params);
    }

    const { error } = await supabase.from("tracker_entries").upsert({
      ...payload,
      team_id: user.data.team_id,
    });

    if (error) {
      throw Error("Something went wrong.");
    }

    revalidateTag(`tracker_projects_${user.data.team_id}`);

    return Promise.resolve(params);
  }
);
