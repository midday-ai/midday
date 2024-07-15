"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateProjectSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateProjectAction = authActionClient
  .schema(updateProjectSchema)
  .action(async ({ parsedInput: params, ctx: { user } }) => {
    const supabase = createClient();

    const { id, ...data } = params;

    await supabase.from("tracker_projects").update(data).eq("id", id);

    revalidateTag(`tracker_projects_${user.team_id}`);

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.ProjectUpdated.name,
      channel: LogEvents.ProjectUpdated.channel,
    });
  });
