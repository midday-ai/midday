import {
  composio,
  composioFetch,
  type ToolkitDetail,
  type ToolsResponse,
} from "@api/composio/client";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { CURATED_TOOLKIT_SLUGS } from "@midday/connectors";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const connectorsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx: { teamId } }) => {
    const session = await composio.create(teamId!);
    const { items } = await session.toolkits({
      toolkits: [...CURATED_TOOLKIT_SLUGS],
      limit: 100,
    });

    return items
      .filter((t: { slug: string; isNoAuth?: boolean }) => !t.isNoAuth)
      .map(
        (t: {
          slug: string;
          name: string;
          logo?: string;
          description?: string;
          connection?: {
            isActive?: boolean;
            connectedAccount?: { id?: string };
          };
        }) => ({
          slug: t.slug,
          name: t.name,
          logo: t.logo ?? null,
          description: t.description ?? null,
          isConnected: t.connection?.isActive ?? false,
          connectedAccountId: t.connection?.connectedAccount?.id ?? null,
        }),
      );
  }),

  detail: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [toolkit, toolsData] = await Promise.all([
        composioFetch<ToolkitDetail>(`/toolkits/${input.slug}`),
        composioFetch<ToolsResponse>(
          `/tools?toolkit_slug=${input.slug}&important=true&limit=20`,
        ),
      ]);

      return {
        slug: toolkit.slug,
        name: toolkit.name,
        description: toolkit.meta.description,
        logo: toolkit.meta.logo,
        appUrl: toolkit.meta.app_url,
        categories: toolkit.meta.categories,
        toolsCount: toolkit.meta.tools_count,
        triggersCount: toolkit.meta.triggers_count,
        authSchemes: toolkit.composio_managed_auth_schemes,
        tools: toolsData.items.map((t) => ({
          slug: t.slug,
          name: t.name,
          description: t.human_description || t.description,
          tags: t.tags,
        })),
      };
    }),

  authorize: protectedProcedure
    .input(
      z.object({
        toolkit: z.string(),
        callbackUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx: { teamId }, input }) => {
      const { toolkit, callbackUrl } = input;

      if (
        !CURATED_TOOLKIT_SLUGS.includes(
          toolkit as (typeof CURATED_TOOLKIT_SLUGS)[number],
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Toolkit "${toolkit}" is not available`,
        });
      }

      const session = await composio.create(teamId!);
      const connectionRequest = await session.authorize(toolkit, {
        callbackUrl,
      });

      return { redirectUrl: connectionRequest.redirectUrl };
    }),

  disconnect: protectedProcedure
    .input(z.object({ connectedAccountId: z.string() }))
    .mutation(async ({ input }) => {
      await composio.connectedAccounts.delete(input.connectedAccountId);
      return { success: true };
    }),
});
