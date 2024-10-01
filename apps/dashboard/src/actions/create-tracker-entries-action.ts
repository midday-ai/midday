"use server";

import { Cookies } from "@/utils/constants";
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
      rate: z.number().optional(),
      currency: z.string().optional(),
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
        date,
      }));

      const { data, error } = await supabase
        .from("tracker_entries")
        .upsert(entries)
        .select(
          "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name, rate, currency)",
        );

      if (error) {
        throw error;
      }

      revalidateTag(`tracker_entries_${user.team_id}`);
      //   revalidatePath("/tracker");

      return data;
    },
  );
