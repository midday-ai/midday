import {
  createShortLinkForDocumentSchema,
  createShortLinkSchema,
  getShortLinkSchema,
} from "@api/schemas/short-links";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import {
  createShortLink,
  getDocumentById,
  getShortLinkByShortId,
} from "@midday/db/queries";
import { signedUrl } from "@midday/supabase/storage";

export const shortLinksRouter = createTRPCRouter({
  createForUrl: protectedProcedure
    .input(createShortLinkSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const result = await createShortLink(db, {
        url: input.url,
        teamId: teamId!,
        userId: session.user.id,
        type: "redirect",
      });

      if (!result) {
        throw new Error("Failed to create short link");
      }

      return {
        ...result,
        shortUrl: `${process.env.MIDDAY_DASHBOARD_URL}/s/${result.shortId}`,
      };
    }),

  createForDocument: protectedProcedure
    .input(createShortLinkForDocumentSchema)
    .mutation(async ({ ctx: { db, teamId, session, supabase }, input }) => {
      const document = await getDocumentById(db, {
        id: input.documentId,
        filePath: input.filePath,
        teamId: teamId!,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // First create the signed URL for the file
      const response = await signedUrl(supabase, {
        bucket: "vault",
        path: document.pathTokens?.join("/") ?? "",
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
        type: "download",
        fileName: document.name ?? undefined,
        // @ts-expect-error
        mimeType: document.metadata?.contentType ?? undefined,
        // @ts-expect-error
        size: document.metadata?.size ?? undefined,
        expiresAt: input.expireIn
          ? new Date(Date.now() + input.expireIn * 1000).toISOString()
          : undefined,
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
