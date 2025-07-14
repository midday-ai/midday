import {
  createOAuthApplication,
  deleteOAuthApplication,
  getOAuthApplicationByClientId,
  getOAuthApplicationById,
  getOAuthApplicationsByTeam,
  regenerateClientSecret,
  updateOAuthApplication,
} from "@api/db/queries/oauth-applications";
import {
  createAuthorizationCode,
  getUserAuthorizedApplications,
  revokeUserApplicationTokens,
} from "@api/db/queries/oauth-flow";
import {
  createOAuthApplicationSchema,
  deleteOAuthApplicationSchema,
  getOAuthApplicationSchema,
  regenerateClientSecretSchema,
  updateOAuthApplicationSchema,
} from "@api/schemas/oauth-applications";
import { revokeUserApplicationAccessSchema } from "@api/schemas/oauth-flow";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "zod";

export const oauthApplicationsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, teamId } = ctx;

    const applications = await getOAuthApplicationsByTeam(db, teamId!);

    return {
      data: applications,
    };
  }),

  getApplicationInfo: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        redirectUri: z.string().url(),
        scope: z.string(),
        state: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { clientId, redirectUri, scope, state } = input;

      // Validate client_id
      const application = await getOAuthApplicationByClientId(db, clientId);
      if (!application || !application.active) {
        throw new Error("Invalid client_id");
      }

      // Validate redirect_uri
      if (!application.redirectUris.includes(redirectUri)) {
        throw new Error("Invalid redirect_uri");
      }

      // Validate scopes
      const requestedScopes = scope.split(" ").filter(Boolean);
      const invalidScopes = requestedScopes.filter(
        (s) => !application.scopes.includes(s),
      );

      if (invalidScopes.length > 0) {
        throw new Error(`Invalid scopes: ${invalidScopes.join(", ")}`);
      }

      // Return application info for consent screen
      return {
        id: application.id,
        name: application.name,
        description: application.description,
        logoUrl: application.logoUrl,
        website: application.website,
        clientId: application.clientId,
        scopes: requestedScopes,
        redirectUri: redirectUri,
        state,
      };
    }),

  authorize: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        decision: z.enum(["allow", "deny"]),
        scopes: z.array(z.string()),
        redirectUri: z.string().url(),
        state: z.string().optional(),
        codeChallenge: z.string().optional(),
        codeChallengeMethod: z.enum(["S256", "plain"]).optional(),
        teamId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const {
        clientId,
        decision,
        scopes,
        redirectUri,
        state,
        codeChallenge,
        codeChallengeMethod,
        teamId,
      } = input;

      // Validate client_id
      const application = await getOAuthApplicationByClientId(db, clientId);
      if (!application || !application.active) {
        throw new Error("Invalid client_id");
      }

      const redirectUrl = new URL(redirectUri);

      // Handle denial
      if (decision === "deny") {
        redirectUrl.searchParams.set("error", "access_denied");
        redirectUrl.searchParams.set("error_description", "User denied access");
        if (state) {
          redirectUrl.searchParams.set("state", state);
        }
        return { redirect_url: redirectUrl.toString() };
      }

      // Create authorization code
      const authCode = await createAuthorizationCode(db, {
        applicationId: application.id,
        userId: session.user.id,
        teamId,
        scopes,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
      });

      if (!authCode) {
        throw new Error("Failed to create authorization code");
      }

      // Build success redirect URL
      redirectUrl.searchParams.set("code", authCode.code);
      if (state) {
        redirectUrl.searchParams.set("state", state);
      }

      return { redirect_url: redirectUrl.toString() };
    }),

  create: protectedProcedure
    .input(createOAuthApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, teamId, session } = ctx;

      const application = await createOAuthApplication(db, {
        ...input,
        teamId: teamId!,
        createdBy: session.user.id,
      });

      return application;
    }),

  get: protectedProcedure
    .input(getOAuthApplicationSchema)
    .query(async ({ ctx, input }) => {
      const { db, teamId } = ctx;

      const application = await getOAuthApplicationById(db, input.id, teamId!);

      if (!application) {
        throw new Error("OAuth application not found");
      }

      return application;
    }),

  update: protectedProcedure
    .input(updateOAuthApplicationSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, teamId } = ctx;
      const { id, ...updateData } = input;

      const application = await updateOAuthApplication(db, {
        ...updateData,
        id,
        teamId: teamId!,
      });

      if (!application) {
        throw new Error("OAuth application not found");
      }

      return application;
    }),

  delete: protectedProcedure
    .input(deleteOAuthApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, teamId } = ctx;

      const result = await deleteOAuthApplication(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!result) {
        throw new Error("OAuth application not found");
      }

      return { success: true };
    }),

  regenerateSecret: protectedProcedure
    .input(regenerateClientSecretSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, teamId } = ctx;

      const result = await regenerateClientSecret(db, input.id, teamId!);

      if (!result) {
        throw new Error("OAuth application not found");
      }

      return result;
    }),

  authorized: protectedProcedure.query(async ({ ctx }) => {
    const { db, teamId, session } = ctx;

    const applications = await getUserAuthorizedApplications(
      db,
      session.user.id,
      teamId!,
    );

    return {
      data: applications,
    };
  }),

  revokeAccess: protectedProcedure
    .input(revokeUserApplicationAccessSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      await revokeUserApplicationTokens(
        db,
        session.user.id,
        input.applicationId,
      );

      return { success: true };
    }),
});
