"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const deleteTrackerEntryAction = authActionClient
  .schema(
    z.object({
      id: z.string(),
    }),
  )
  .metadata({
    name: "delete-tracker-entry",
  })
  .action(async ({ parsedInput: { id }, ctx: { supabase, user } }) => {
    const { data, error } = await supabase
      .from("tracker_entries")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    revalidateTag(`tracker_entries_${user.team_id}`);

    return data;
  });
