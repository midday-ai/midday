import {
  acceptTeamInviteSchema,
  createTeamSchema,
  declineTeamInviteSchema,
  deleteTeamInviteSchema,
  deleteTeamMemberSchema,
  deleteTeamSchema,
  inviteTeamMembersSchema,
  leaveTeamSchema,
  updateBaseCurrencySchema,
  updateTeamByIdSchema,
  updateTeamMemberSchema,
} from "@api/schemas/team";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import type { InviteTeamMembersPayload } from "@jobs/schema";
import { chatCache } from "@midday/cache/chat-cache";
import { teamCache } from "@midday/cache/team-cache";
import { teamPermissionsCache } from "@midday/cache/team-permissions-cache";
import {
  acceptTeamInvite,
  createTeam,
  createTeamInvites,
  declineTeamInvite,
  deleteTeam,
  deleteTeamInvite,
  deleteTeamMember,
  getAvailablePlans,
  getBankConnections,
  getEInvoiceRegistration,
  getInboxAccounts,
  getInvitesByEmail,
  getTeamById,
  getTeamInvites,
  getTeamMemberRole,
  getTeamMembersByTeamId,
  getTeamsByUserId,
  hasTeamAccess,
  leaveTeam,
  updateEInvoiceRegistration,
  updateTeamById,
  updateTeamMember,
  upsertEInvoiceRegistration,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { tasks } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const teamRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return null;
    }

    return getTeamById(db, teamId!);
  }),

  update: protectedProcedure
    .input(updateTeamByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateTeamById(db, {
        id: teamId!,
        data: input,
      });
    }),

  members: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTeamMembersByTeamId(db, teamId!);
  }),

  list: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getTeamsByUserId(db, session.user.id);
  }),

  create: protectedProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const teamId = await createTeam(db, {
        ...input,
        userId: session.user.id,
        email: session.user.email!,
      });

      if (input.switchTeam) {
        await teamPermissionsCache.delete(`user:${session.user.id}:team`);
      }

      return teamId;
    }),

  leave: protectedProcedure
    .input(leaveTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const teamMembersData = await getTeamMembersByTeamId(db, input.teamId);

      const currentUser = teamMembersData?.find(
        (member) => member.user?.id === session.user.id,
      );

      const totalOwners = teamMembersData?.filter(
        (member) => member.role === "owner",
      ).length;

      if (currentUser?.role === "owner" && totalOwners === 1) {
        throw Error("Action not allowed");
      }

      const result = await leaveTeam(db, {
        userId: session.user.id,
        teamId: input.teamId,
      });

      await teamPermissionsCache.delete(`user:${session.user.id}:team`);

      return result;
    }),

  acceptInvite: protectedProcedure
    .input(acceptTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return acceptTeamInvite(db, {
        id: input.id,
        userId: session.user.id,
      });
    }),

  declineInvite: protectedProcedure
    .input(declineTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return declineTeamInvite(db, {
        id: input.id,
        email: session.user.email!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      // Check if the user has access to the team before deleting
      const canAccess = await hasTeamAccess(db, input.teamId, session.user.id);

      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this team",
        });
      }

      // Fetch team data BEFORE deleting (for cleanup job)
      const team = await getTeamById(db, input.teamId);

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const bankConnections = await getBankConnections(db, {
        teamId: input.teamId,
      });

      // Trigger cleanup job BEFORE deleting team from database.
      // This ensures that if job triggering fails (Redis down, queue unavailable),
      // the team remains intact and the user can retry. The cleanup job will handle
      // bank connection deletion. Subscription cancellation should be done manually
      // by the user via the customer portal before deleting the team.
      await triggerJob(
        "delete-team",
        {
          teamId: input.teamId!,
          connections: bankConnections.map((c) => ({
            referenceId: c.referenceId,
            provider: c.provider,
            accessToken: c.accessToken,
          })),
        },
        "teams",
      );

      const data = await deleteTeam(db, {
        teamId: input.teamId,
        userId: session.user.id,
      });

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete team",
        });
      }

      try {
        await Promise.all([
          chatCache.invalidateTeamContext(input.teamId),
          ...data.memberUserIds.map((userId) =>
            Promise.all([
              teamPermissionsCache.delete(`user:${userId}:team`),
              teamCache.delete(`user:${userId}:team:${input.teamId}`),
              chatCache.invalidateUserContext(userId, input.teamId),
            ]),
          ),
        ]);
      } catch {
        // Non-fatal — team deletion succeeded, cache will expire naturally
      }
    }),

  deleteMember: protectedProcedure
    .input(deleteTeamMemberSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      if (input.teamId !== teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this team",
        });
      }

      const callerRole = await getTeamMemberRole(db, teamId!, session.user.id);

      if (callerRole !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only team owners can remove members",
        });
      }

      // Prevent removing the last owner
      const targetRole = await getTeamMemberRole(db, teamId!, input.userId);

      if (targetRole === "owner") {
        const teamMembers = await getTeamMembersByTeamId(db, teamId!);
        const totalOwners = teamMembers?.filter(
          (member) => member.role === "owner",
        ).length;

        if (totalOwners === 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot remove the last team owner",
          });
        }
      }

      return deleteTeamMember(db, {
        teamId: input.teamId,
        userId: input.userId,
      });
    }),

  updateMember: protectedProcedure
    .input(updateTeamMemberSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      if (input.teamId !== teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this team",
        });
      }

      const callerRole = await getTeamMemberRole(db, teamId!, session.user.id);

      if (callerRole !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only team owners can update member roles",
        });
      }

      // Prevent demoting the last owner to member
      if (input.role === "member") {
        const targetRole = await getTeamMemberRole(db, teamId!, input.userId);

        if (targetRole === "owner") {
          const teamMembers = await getTeamMembersByTeamId(db, teamId!);
          const totalOwners = teamMembers?.filter(
            (member) => member.role === "owner",
          ).length;

          if (totalOwners === 1) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot demote the last team owner",
            });
          }
        }
      }

      return updateTeamMember(db, input);
    }),

  teamInvites: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTeamInvites(db, teamId!);
  }),

  invitesByEmail: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getInvitesByEmail(db, session.user.email!);
  }),

  invite: protectedProcedure
    .input(inviteTeamMembersSchema)
    .mutation(async ({ ctx: { db, session, teamId, geo }, input }) => {
      const ip = geo.ip ?? "127.0.0.1";

      const data = await createTeamInvites(db, {
        teamId: teamId!,
        invites: input.map((invite) => ({
          ...invite,
          invitedBy: session.user.id,
        })),
      });

      const results = data?.results ?? [];
      const skippedInvites = data?.skippedInvites ?? [];

      const invites = results.map((invite) => ({
        email: invite?.email!,
        invitedBy: session.user.id!,
        invitedByName: session.user.full_name!,
        invitedByEmail: session.user.email!,
        teamName: invite?.team?.name!,
        inviteCode: invite?.code!,
      }));

      // Only trigger email sending if there are valid invites
      if (invites.length > 0) {
        await tasks.trigger("invite-team-members", {
          teamId: teamId!,
          invites,
          ip,
          locale: "en",
        } satisfies InviteTeamMembersPayload);
      }

      // Return information about the invitation process
      return {
        sent: invites.length,
        skipped: skippedInvites.length,
        skippedInvites,
      };
    }),

  deleteInvite: protectedProcedure
    .input(deleteTeamInviteSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTeamInvite(db, {
        teamId: teamId!,
        id: input.id,
      });
    }),

  availablePlans: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getAvailablePlans(db, teamId!);
  }),

  updateBaseCurrency: protectedProcedure
    .input(updateBaseCurrencySchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      return triggerJob(
        "update-base-currency",
        {
          teamId: teamId!,
          baseCurrency: input.baseCurrency,
        },
        "transactions",
      );
    }),

  /**
   * Get unified connection status for the team.
   * Returns raw connection data - presentation logic handled by client.
   */
  connectionStatus: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      if (!teamId) {
        return { bankConnections: [], inboxAccounts: [] };
      }

      // Fetch bank connections and inbox accounts in parallel
      const [bankConnections, inboxAccounts] = await Promise.all([
        getBankConnections(db, { teamId }),
        getInboxAccounts(db, teamId),
      ]);

      return {
        bankConnections: bankConnections.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          expiresAt: c.expiresAt,
          logoUrl: c.logoUrl,
        })),
        inboxAccounts: inboxAccounts.map((a) => ({
          id: a.id,
          email: a.email,
          status: a.status,
          provider: a.provider,
        })),
      };
    },
  ),

  // E-Invoice registration
  eInvoiceRegistration: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      if (!teamId) return null;

      return getEInvoiceRegistration(db, { teamId, provider: "peppol" });
    },
  ),

  registerForEInvoice: protectedProcedure.mutation(
    async ({ ctx: { db, teamId } }) => {
      if (!teamId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const team = await getTeamById(db, teamId);
      if (
        !team?.addressLine1 ||
        !team?.city ||
        !team?.zip ||
        !team?.vatNumber ||
        !team?.countryCode ||
        !team?.email
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Complete company address, city, postal code, email, and VAT number are required",
        });
      }

      // Validate formats using Zod for consistency with the rest of the codebase
      const formatValidation = z
        .object({
          email: z
            .string()
            .email("Company email must be a valid email address"),
          countryCode: z
            .string()
            .length(2, "Country code must be a 2-letter ISO code")
            .regex(/^[A-Z]{2}$/i, "Country code must be a 2-letter ISO code"),
          vatNumber: z.string().trim().min(1, "VAT number cannot be empty"),
        })
        .safeParse({
          email: team.email,
          countryCode: team.countryCode,
          vatNumber: team.vatNumber,
        });

      if (!formatValidation.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: formatValidation.error.issues[0]?.message ?? "Invalid input",
        });
      }

      // Check if already registered or processing (guard before upsert)
      const existing = await getEInvoiceRegistration(db, {
        teamId,
        provider: "peppol",
      });

      if (existing?.status === "registered") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already registered for e-invoicing",
        });
      }

      if (existing?.status === "processing") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Registration is already in progress",
        });
      }

      // Atomic upsert — the unique constraint on (team_id, provider) prevents
      // duplicate rows even if concurrent requests pass the guard above.
      const registration = await upsertEInvoiceRegistration(db, {
        teamId,
        provider: "peppol",
        status: "pending",
        faults: null,
      });

      if (!registration) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create registration record",
        });
      }

      const registrationId = registration.id;

      // Trigger the registration worker job — roll back status on failure
      try {
        await triggerJob("register-supplier", { teamId }, "invoices");
      } catch (err) {
        await updateEInvoiceRegistration(db, {
          id: registrationId,
          status: "error",
          faults: [
            {
              message: "Failed to start registration. Please try again later.",
            },
          ],
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start registration job",
          cause: err,
        });
      }

      return { status: "pending" };
    },
  ),
});
