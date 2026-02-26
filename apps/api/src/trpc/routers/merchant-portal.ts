import {
  createMerchantInvite,
  createMerchantMessage,
  createMerchantSession,
  createPayoffLetterRequest,
  getMerchantByPortalId,
  getMerchantAccess,
  getMerchantAccessByMerchant,
  getMerchantDocumentsByPortal,
  getMerchantInviteByCode,
  getMerchantInvitesByTeam,
  getMerchantMessagesByPortal,
  getMerchantNotificationsByPortal,
  getMerchantSession,
  getPayoffLetterRequests,
  getPayoffRequestsByPortal,
  getUnreadNotificationCount,
  markNotificationRead,
  acceptMerchantInvite,
  approvePayoffLetterRequest,
  rejectPayoffLetterRequest,
  revokeMerchantAccess,
  revokeMerchantInvite,
  verifyMerchantSession,
  getMcaDealsByPortalId,
  getMcaPaymentsByPortalDeal,
} from "@midday/db/queries";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";

// ============================================================================
// Schemas
// ============================================================================

const getPortalDataSchema = z.object({
  portalId: z.string().min(1),
});

const getMcaDealsSchema = z.object({
  portalId: z.string().min(1),
});

const getMcaPaymentsSchema = z.object({
  portalId: z.string().min(1),
  dealId: z.string().uuid(),
});

const requestVerificationSchema = z.object({
  portalId: z.string().min(1),
  email: z.string().email(),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

const requestPayoffLetterSchema = z.object({
  sessionId: z.string().uuid(),
  dealId: z.string().uuid(),
  requestedPayoffDate: z.string(),
});

const createInviteSchema = z.object({
  email: z.string().email(),
  merchantId: z.string().uuid(),
});

const getInviteByCodeSchema = z.object({
  code: z.string().min(1),
});

const acceptInviteSchema = z.object({
  code: z.string().min(1),
});

const revokeInviteSchema = z.object({
  id: z.string().uuid(),
});

const getAccessByMerchantSchema = z.object({
  merchantId: z.string().uuid(),
});

const revokeAccessSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().optional(),
});

const getPayoffRequestsSchema = z.object({
  merchantId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  status: z.string().optional(),
});

const approvePayoffRequestSchema = z.object({
  id: z.string().uuid(),
  documentPath: z.string().optional(),
  expiresAt: z.string().optional(),
});

const rejectPayoffRequestSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// Router
// ============================================================================

export const merchantPortalRouter = createTRPCRouter({
  // =========================================================================
  // Public Procedures (for merchant portal - no auth required)
  // =========================================================================

  /**
   * Get portal data including merchant info, team branding, and MCA deals
   */
  getPortalData: publicProcedure
    .input(getPortalDataSchema)
    .query(async ({ ctx: { db }, input }) => {
      const result = await getMcaDealsByPortalId(db, {
        portalId: input.portalId,
      });

      if (!result) {
        return null;
      }

      return {
        merchant: result.merchant,
        deals: result.deals,
        summary: result.summary,
      };
    }),

  /**
   * Get MCA deals for a portal (alias for getPortalData)
   */
  getMcaDeals: publicProcedure
    .input(getMcaDealsSchema)
    .query(async ({ ctx: { db }, input }) => {
      const result = await getMcaDealsByPortalId(db, {
        portalId: input.portalId,
      });

      if (!result) {
        return { deals: [], summary: null };
      }

      return {
        deals: result.deals,
        summary: result.summary,
      };
    }),

  /**
   * Get payments for a specific MCA deal (public, but requires valid portal ID)
   */
  getMcaPayments: publicProcedure
    .input(getMcaPaymentsSchema)
    .query(async ({ ctx: { db }, input }) => {
      const payments = await getMcaPaymentsByPortalDeal(db, {
        portalId: input.portalId,
        dealId: input.dealId,
      });

      return payments || [];
    }),

  /**
   * Request email verification for authenticated actions
   */
  requestVerification: publicProcedure
    .input(requestVerificationSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      // Get merchant by portal ID
      const merchant = await getMerchantByPortalId(db, {
        portalId: input.portalId,
      });

      if (!merchant) {
        throw new Error("Portal not found");
      }

      // Verify email matches merchant email
      if (merchant.email.toLowerCase() !== input.email.toLowerCase()) {
        throw new Error("Email does not match our records");
      }

      // Create verification session
      const session = await createMerchantSession(db, {
        merchantId: merchant.id,
        portalId: input.portalId,
        email: input.email.toLowerCase(),
        expiresInMinutes: 15,
      });

      // TODO: Send email via Trigger.dev job
      // For now, return success with the token (in production, don't expose token)
      return {
        success: true,
        message: "Verification email sent",
        // Only include token in development for testing
        ...(process.env.NODE_ENV === "development" && {
          token: session?.verificationToken,
        }),
      };
    }),

  /**
   * Verify magic link token
   */
  verifyToken: publicProcedure
    .input(verifyTokenSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const session = await verifyMerchantSession(db, {
        token: input.token,
      });

      if (!session) {
        throw new Error("Invalid or expired token");
      }

      return {
        success: true,
        sessionId: session.id,
        expiresAt: session.expiresAt,
      };
    }),

  /**
   * Get invite by code (for invite acceptance page)
   */
  getInviteByCode: publicProcedure
    .input(getInviteByCodeSchema)
    .query(async ({ ctx: { db }, input }) => {
      const invite = await getMerchantInviteByCode(db, {
        code: input.code,
      });

      if (!invite) {
        return null;
      }

      return {
        id: invite.id,
        email: invite.email,
        merchantName: invite.merchantName,
        teamName: invite.teamName,
        teamLogoUrl: invite.teamLogoUrl,
        expiresAt: invite.expiresAt,
      };
    }),

  // =========================================================================
  // Portal Self-Service Procedures (public, validated by portalId)
  // =========================================================================

  /**
   * Get documents for a merchant portal
   */
  getDocuments: publicProcedure
    .input(
      z.object({
        portalId: z.string().min(1),
        documentType: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { db }, input }) => {
      return getMerchantDocumentsByPortal(db, {
        portalId: input.portalId,
        documentType: input.documentType,
      });
    }),

  /**
   * Get messages for a merchant portal
   */
  getMessages: publicProcedure
    .input(z.object({ portalId: z.string().min(1) }))
    .query(async ({ ctx: { db }, input }) => {
      return getMerchantMessagesByPortal(db, { portalId: input.portalId });
    }),

  /**
   * Send a message from the portal (merchant → funder)
   */
  sendMessage: publicProcedure
    .input(
      z.object({
        portalId: z.string().min(1),
        subject: z.string().optional(),
        message: z.string().min(1),
        fromEmail: z.string().email(),
        fromName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const merchant = await getMerchantByPortalId(db, {
        portalId: input.portalId,
      });

      if (!merchant) {
        throw new Error("Portal not found");
      }

      const result = await createMerchantMessage(db, {
        merchantId: merchant.id,
        teamId: merchant.teamId,
        direction: "inbound",
        subject: input.subject,
        message: input.message,
        fromEmail: input.fromEmail,
        fromName: input.fromName,
      });

      return { success: true, messageId: result?.id };
    }),

  /**
   * Get notifications for a merchant portal
   */
  getNotifications: publicProcedure
    .input(
      z.object({
        portalId: z.string().min(1),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx: { db }, input }) => {
      return getMerchantNotificationsByPortal(db, {
        portalId: input.portalId,
        limit: input.limit,
      });
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: publicProcedure
    .input(z.object({ portalId: z.string().min(1) }))
    .query(async ({ ctx: { db }, input }) => {
      return getUnreadNotificationCount(db, { portalId: input.portalId });
    }),

  /**
   * Mark a notification as read
   */
  markNotificationRead: publicProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx: { db }, input }) => {
      const result = await markNotificationRead(db, {
        notificationId: input.notificationId,
      });
      return { success: !!result };
    }),

  /**
   * Get payoff requests for portal (public, validates by portalId)
   */
  getPayoffRequestsByPortal: publicProcedure
    .input(z.object({ portalId: z.string().min(1) }))
    .query(async ({ ctx: { db }, input }) => {
      return getPayoffRequestsByPortal(db, { portalId: input.portalId });
    }),

  // =========================================================================
  // Merchant-Authenticated Procedures (require valid session)
  // =========================================================================

  /**
   * Request a payoff letter (requires verified merchant session)
   */
  requestPayoffLetter: publicProcedure
    .input(requestPayoffLetterSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      // Verify session
      const session = await getMerchantSession(db, {
        sessionId: input.sessionId,
      });

      if (!session) {
        throw new Error("Invalid or expired session");
      }

      // Get the deal to calculate payoff
      const portalData = await getMcaDealsByPortalId(db, {
        portalId: session.portalId,
      });

      if (!portalData) {
        throw new Error("Portal not found");
      }

      const deal = portalData.deals.find((d) => d.id === input.dealId);

      if (!deal) {
        throw new Error("Deal not found");
      }

      // Create payoff letter request
      const request = await createPayoffLetterRequest(db, {
        dealId: input.dealId,
        merchantId: session.merchantId,
        teamId: session.teamId!,
        requestedPayoffDate: input.requestedPayoffDate,
        requestedByEmail: session.email,
        balanceAtRequest: deal.currentBalance,
        payoffAmount: deal.currentBalance, // Could apply discount logic here
      });

      return {
        success: true,
        requestId: request?.id,
      };
    }),

  // =========================================================================
  // Protected Procedures (for MCA operators - requires team auth)
  // =========================================================================

  /**
   * Create invite for a merchant
   */
  createInvite: protectedProcedure
    .input(createInviteSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const result = await createMerchantInvite(db, {
        email: input.email,
        merchantId: input.merchantId,
        teamId: teamId!,
        invitedBy: session.user.id,
      });

      // TODO: Send invite email via Trigger.dev job

      return {
        invite: result.invite,
        isNew: result.isNew,
      };
    }),

  /**
   * Accept an invite (user must be logged in)
   */
  acceptInvite: protectedProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const access = await acceptMerchantInvite(db, {
        code: input.code,
        userId: session.user.id,
      });

      if (!access) {
        throw new Error("Invite not found or already accepted");
      }

      return {
        success: true,
        accessId: access.id,
      };
    }),

  /**
   * Get invites for a team (admin view)
   */
  getInvites: protectedProcedure
    .input(
      z.object({
        merchantId: z.string().uuid().optional(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const invites = await getMerchantInvitesByTeam(db, {
        teamId: teamId!,
        merchantId: input.merchantId,
        status: input.status,
      });

      return invites;
    }),

  /**
   * Revoke an invite
   */
  revokeInvite: protectedProcedure
    .input(revokeInviteSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const result = await revokeMerchantInvite(db, {
        id: input.id,
        teamId: teamId!,
      });

      return { success: !!result };
    }),

  /**
   * Get merchant access records for a merchant
   */
  getAccessByMerchant: protectedProcedure
    .input(getAccessByMerchantSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const access = await getMerchantAccessByMerchant(db, {
        merchantId: input.merchantId,
        teamId: teamId!,
      });

      return access;
    }),

  /**
   * Revoke merchant access
   */
  revokeAccess: protectedProcedure
    .input(revokeAccessSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const result = await revokeMerchantAccess(db, {
        id: input.id,
        teamId: teamId!,
        revokedBy: session.user.id,
        reason: input.reason,
      });

      return { success: !!result };
    }),

  /**
   * Get payoff letter requests (admin view)
   */
  getPayoffRequests: protectedProcedure
    .input(getPayoffRequestsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const requests = await getPayoffLetterRequests(db, {
        teamId: teamId!,
        merchantId: input.merchantId,
        dealId: input.dealId,
        status: input.status,
      });

      return requests;
    }),

  /**
   * Approve a payoff letter request
   */
  approvePayoffRequest: protectedProcedure
    .input(approvePayoffRequestSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const result = await approvePayoffLetterRequest(db, {
        id: input.id,
        teamId: teamId!,
        approvedBy: session.user.id,
        documentPath: input.documentPath,
        expiresAt: input.expiresAt,
      });

      return { success: !!result };
    }),

  /**
   * Reject a payoff letter request
   */
  rejectPayoffRequest: protectedProcedure
    .input(rejectPayoffRequestSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const result = await rejectPayoffLetterRequest(db, {
        id: input.id,
        teamId: teamId!,
      });

      return { success: !!result };
    }),
});
