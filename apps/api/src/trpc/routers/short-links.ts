import {
  createShortLink,
  getShortLinkByShortId,
} from "@api/db/queries/short-links";
import {
  createShortLinkForFileSchema,
  createShortLinkSchema,
  getShortLinkSchema,
} from "@api/schemas/short-links";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import { signedUrl } from "@midday/supabase/storage";

export const shortLinksRouter = createTRPCRouter({
  createForUrl: protectedProcedure
    .input(createShortLinkSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const result = await createShortLink(db, {
        url: input.url,
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!result) {
        throw new Error("Failed to create short link");
      }

      return {
        ...result,
        shortUrl: `${process.env.MIDDAY_DASHBOARD_URL}/s/${result.shortId}`,
      };
    }),

  createForFile: protectedProcedure
    .input(createShortLinkForFileSchema)
    .mutation(async ({ ctx: { db, teamId, session, supabase }, input }) => {
      // First create the signed URL for the file
      const response = await signedUrl(supabase, {
        bucket: "vault",
        path: input.fullPath,
        expireIn: input.expireIn,
        options: {
          download: true,
        },
      });

      if (!response.data?.signedUrl) {
        throw new Error("Failed to create signed URL for file");
      }

      // Then create a short link for the signed URL
      const result = await createShortLink(db, {
        url: response.data.signedUrl,
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!result) {
        throw new Error("Failed to create short link");
      }

      return {
        ...result,
        shortUrl: `${process.env.MIDDAY_DASHBOARD_URL}/s/${result.shortId}`,
        originalUrl: response.data.signedUrl,
      };
    }),

  get: publicProcedure
    .input(getShortLinkSchema)
    .query(async ({ ctx: { db }, input }) => {
      return getShortLinkByShortId(db, input.shortId);
    }),
});
