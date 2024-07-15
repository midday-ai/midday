"use server";

import { authActionClient } from "@/actions/safe-action";
import { deleteProjectSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const deleteProjectAction = authActionClient
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput: params, ctx: { user } }) => {
    const supabase = createClient();

    await supabase.from("tracker_projects").delete().eq("id", params.id);

    revalidateTag(`tracker_projects_${user.team_id}`);

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.ProjectDeleted.name,
      channel: LogEvents.ProjectDeleted.channel,
    });
  });
