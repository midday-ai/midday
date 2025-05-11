import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { disconnectApp, updateAppSettings } from "@midday/supabase/mutations";
import { getInstalledAppsQuery } from "@midday/supabase/queries";
import { z } from "zod";

export const appsRouter = createTRPCRouter({
  installed: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getInstalledAppsQuery(supabase, teamId!);

    return data?.map((app) => app.app_id) ?? [];
  }),

  disconnect: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { appId } = input;

      return disconnectApp(supabase, { appId, teamId: teamId! });
    }),

  update: protectedProcedure
    .input(
      z.object({
        appId: z.string(),
        option: z.object({
          id: z.string(),
          value: z.union([z.string(), z.number(), z.boolean()]),
        }),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { appId, option } = input;

      return updateAppSettings(supabase, {
        appId,
        teamId: teamId!,
        option,
      });
    }),
});
