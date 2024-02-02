"use server";

import { action } from "@/actions/safe-action";
import { updateProjectSchema } from "@/actions/schema";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateProjectAction = action(
  updateProjectSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { id, ...data } = params;

    await supabase.from("tracker_projects").update(data).eq("id", id);

    revalidateTag(`tracker_projects_${user.data.team_id}`);
  }
);
