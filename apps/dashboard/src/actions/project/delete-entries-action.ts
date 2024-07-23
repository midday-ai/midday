"use server";

import { authActionClient } from "@/actions/safe-action";
import { deleteEntriesSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";

export const deleteEntriesAction = authActionClient
  .schema(deleteEntriesSchema)
  .metadata({
    name: "delete-entries",
    track: {
      event: LogEvents.TrackerDeleteEntry.name,
      channel: LogEvents.TrackerDeleteEntry.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    await supabase.from("tracker_entries").delete().eq("id", params.id);

    revalidateTag(`tracker_projects_${user.team_id}`);
    revalidateTag(`tracker_entries_${user.team_id}`);
  });
