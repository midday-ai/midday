import {
  createExcludedSenderSchema,
  createInboxSettingSchema,
  deleteInboxSettingSchema,
  listInboxSettingsSchema,
} from "@api/schemas/inbox";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createInboxSetting,
  deleteInboxSetting,
  getExcludedSenders,
  getInboxSettings,
} from "@midday/db/queries";

export const inboxSettingsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listInboxSettingsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInboxSettings(db, {
        teamId: teamId!,
        settingType: input?.settingType,
      });
    }),

  listExcludedSenders: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getExcludedSenders(db, teamId!);
    },
  ),

  create: protectedProcedure
    .input(createInboxSettingSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return createInboxSetting(db, {
        teamId: teamId!,
        settingType: input.settingType,
        settingValue: input.settingValue,
        settingConfig: input.settingConfig ?? null,
        userId: session.user.id,
      });
    }),

  createExcludedSender: protectedProcedure
    .input(createExcludedSenderSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return createInboxSetting(db, {
        teamId: teamId!,
        settingType: "excluded_sender",
        settingValue: input.senderEmail,
        settingConfig: null,
        userId: session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(deleteInboxSettingSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteInboxSetting(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});

