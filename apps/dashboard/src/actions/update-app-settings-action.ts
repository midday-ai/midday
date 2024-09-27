"use server";

import { LogEvents } from "@midday/events/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const updateAppSettingsAction = authActionClient
  .schema(
    z.object({
      app_id: z.string(),
      option: z.object({
        id: z.string(),
        value: z.unknown(),
      }),
    }),
  )
  .metadata({
    name: "update-app-settings",
    track: {
      event: LogEvents.UpdateAppSettings.name,
      channel: LogEvents.UpdateAppSettings.channel,
    },
  })
  .action(
    async ({ parsedInput: { app_id, option }, ctx: { user, supabase } }) => {
      const { data: existingApp } = await supabase
        .from("apps")
        .select("settings")
        .eq("app_id", app_id)
        .eq("team_id", user.team_id)
        .single();

      if (!existingApp) {
        throw new Error("App not found");
      }

      const updatedSettings = existingApp?.settings.map((setting) => {
        if (setting.id === option.id) {
          return { ...setting, value: option.value };
        }
        return setting;
      });

      const { data, error } = await supabase
        .from("apps")
        .update({ settings: updatedSettings })
        .eq("app_id", app_id)
        .eq("team_id", user.team_id)
        .select()
        .single();

      if (!data) {
        throw new Error("Failed to update app settings");
      }

      revalidatePath("/apps");

      return data;
    },
  );
