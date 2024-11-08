"use server";

import { Cookies } from "@/utils/constants";
import { UTCDate } from "@date-fns/utc";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const createTrackerEntriesAction = authActionClient
  .schema(
    z.object({
      id: z.string().optional(),
      start: z.string(),
      stop: z.string(),
      dates: z.array(z.string()),
      assigned_id: z.string(),
      project_id: z.string(),
      description: z.string().optional(),
      duration: z.number(),
    }),
  )
  .metadata({
    name: "create-tracker-entries",
  })
  .action(
    async ({ parsedInput: { dates, ...params }, ctx: { supabase, user } }) => {
      cookies().set(Cookies.LastProject, params.project_id);

      const entries = dates.map((date) => ({
        ...params,
        team_id: user.team_id,
        date: new UTCDate(date).toISOString(),
        start: new UTCDate(params.start).toISOString(),
        stop: new UTCDate(params.stop).toISOString(),
      }));

      const { data, error } = await supabase
        .from("tracker_entries")
        .upsert(entries, {
          ignoreDuplicates: false,
        })
        .select(
          "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name, rate, currency)",
        );

      if (error) {
        throw error;
      }

      revalidateTag(`tracker_entries_${user.team_id}`);
      revalidateTag(`tracker_projects_${user.team_id}`);

      return data;
    },
  );
