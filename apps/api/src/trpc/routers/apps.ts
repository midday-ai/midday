import {
  disconnectAppSchema,
  removeWhatsAppConnectionSchema,
  updateAppSettingsSchema,
} from "@api/schemas/apps";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  disconnectApp,
  getApps,
  removeWhatsAppConnection,
  updateAppSettings,
} from "@midday/db/queries";

export const appsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getApps(db, teamId!);
  }),

  disconnect: protectedProcedure
    .input(disconnectAppSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { appId } = input;

      return disconnectApp(db, { appId, teamId: teamId! });
    }),

  update: protectedProcedure
    .input(updateAppSettingsSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { appId, option } = input;

      return updateAppSettings(db, {
        appId,
        teamId: teamId!,
        option,
      });
    }),

  removeWhatsAppConnection: protectedProcedure
    .input(removeWhatsAppConnectionSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const { phoneNumber } = input;

      return removeWhatsAppConnection(db, {
        teamId: teamId!,
        phoneNumber,
      });
    }),
});
