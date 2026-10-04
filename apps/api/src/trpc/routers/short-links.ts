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
import { assertStorageTeamKey } from "@api/utils/storage";
import {
  createShortLink,
  getDocumentById,
  getShortLinkByShortId,
} from "@midday/db/queries";
import { createSignedUrl } from "@midday/storage";
import { isLocalBackend } from "@midday/utils/backend";

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
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const document = await getDocumentById(db, {
        id: input.documentId,
        filePath: input.filePath,
        teamId: teamId!,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Return a short-lived direct URL for callers, but persist only the object key.
      const key = assertStorageTeamKey(teamId!, document.pathTokens ?? []);
      const url = await createSignedUrl("vault", key, {
        expiresIn: isLocalBackend() ? 60 : input.expireIn,
        download: true,
      });

      // The short link owns its expiry; each resolution creates a fresh signature.
      const result = await createShortLink(db, {
        url: isLocalBackend() ? `storage://vault/${key}` : url,
        ...(isLocalBackend()
          ? { bucket: "vault" as const, objectKey: key }
          : {}),
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
        originalUrl: url,
      };
    }),

  get: publicProcedure
    .input(getShortLinkSchema)
    .query(async ({ ctx: { db }, input }) => {
      const link = await getShortLinkByShortId(db, input.shortId);
      if (
        !link ||
        (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now())
      )
        return null;
      if (!isLocalBackend() || !link.objectKey) return link;
      if (link.bucket !== "vault") return null;
      const key = assertStorageTeamKey(link.teamId, link.objectKey);
      const url = await createSignedUrl("vault", key, {
        expiresIn: 60,
        download: true,
      });
      return { ...link, url };
    }),
});
