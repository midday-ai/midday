import type { Database } from "@db/client";
import {
  merchants,
  merchantPortalAccess,
  merchantPortalInvites,
  merchantPortalSessions,
  payoffLetterRequests,
  merchantMessages,
  merchantDocuments,
  merchantNotifications,
  mcaDeals,
  teams,
  users,
} from "@db/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// Merchant Portal Session Queries (Magic Link Auth)
// ============================================================================

type CreateMerchantSessionParams = {
  merchantId: string;
  portalId: string;
  email: string;
  expiresInMinutes?: number;
};

export const createMerchantSession = async (
  db: Database,
  params: CreateMerchantSessionParams,
) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (params.expiresInMinutes || 15));

  const [session] = await db
    .insert(merchantPortalSessions)
    .values({
      merchantId: params.merchantId,
      portalId: params.portalId,
      email: params.email,
      verificationToken: nanoid(32),
      expiresAt: expiresAt.toISOString(),
    })
    .returning();

  return session;
};

type VerifyMerchantSessionParams = {
  token: string;
};

export const verifyMerchantSession = async (
  db: Database,
  params: VerifyMerchantSessionParams,
) => {
  const now = new Date().toISOString();

  // Find valid, unexpired, unverified session
  const [session] = await db
    .select()
    .from(merchantPortalSessions)
    .where(
      and(
        eq(merchantPortalSessions.verificationToken, params.token),
        gt(merchantPortalSessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  // Mark as verified and extend expiration to 30 days
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 30);

  const [updatedSession] = await db
    .update(merchantPortalSessions)
    .set({
      verifiedAt: now,
      expiresAt: newExpiresAt.toISOString(),
      lastActiveAt: now,
    })
    .where(eq(merchantPortalSessions.id, session.id))
    .returning();

  return updatedSession;
};

type GetMerchantSessionParams = {
  sessionId: string;
};

export const getMerchantSession = async (
  db: Database,
  params: GetMerchantSessionParams,
) => {
  const now = new Date().toISOString();

  const [session] = await db
    .select({
      id: merchantPortalSessions.id,
      merchantId: merchantPortalSessions.merchantId,
      portalId: merchantPortalSessions.portalId,
      email: merchantPortalSessions.email,
      verifiedAt: merchantPortalSessions.verifiedAt,
      expiresAt: merchantPortalSessions.expiresAt,
      // Merchant info
      merchantName: merchants.name,
      teamId: merchants.teamId,
    })
    .from(merchantPortalSessions)
    .where(
      and(
        eq(merchantPortalSessions.id, params.sessionId),
        gt(merchantPortalSessions.expiresAt, now),
        sql`${merchantPortalSessions.verifiedAt} IS NOT NULL`,
      ),
    )
    .leftJoin(merchants, eq(merchants.id, merchantPortalSessions.merchantId))
    .limit(1);

  return session;
};

export const updateMerchantSessionActivity = async (
  db: Database,
  params: { sessionId: string; ipAddress?: string },
) => {
  await db
    .update(merchantPortalSessions)
    .set({
      lastActiveAt: new Date().toISOString(),
      ipAddress: params.ipAddress,
    })
    .where(eq(merchantPortalSessions.id, params.sessionId));
};

// ============================================================================
// Merchant Portal Invite Queries
// ============================================================================

type CreateMerchantInviteParams = {
  email: string;
  merchantId: string;
  teamId: string;
  invitedBy: string;
};

export const createMerchantInvite = async (
  db: Database,
  params: CreateMerchantInviteParams,
) => {
  // Check for existing pending invite
  const [existingInvite] = await db
    .select()
    .from(merchantPortalInvites)
    .where(
      and(
        eq(merchantPortalInvites.email, params.email.toLowerCase()),
        eq(merchantPortalInvites.merchantId, params.merchantId),
        eq(merchantPortalInvites.status, "pending"),
      ),
    )
    .limit(1);

  if (existingInvite) {
    return { invite: existingInvite, isNew: false };
  }

  const [invite] = await db
    .insert(merchantPortalInvites)
    .values({
      email: params.email.toLowerCase(),
      merchantId: params.merchantId,
      teamId: params.teamId,
      invitedBy: params.invitedBy,
      code: nanoid(24),
    })
    .returning();

  return { invite, isNew: true };
};

type GetMerchantInviteByCodeParams = {
  code: string;
};

export const getMerchantInviteByCode = async (
  db: Database,
  params: GetMerchantInviteByCodeParams,
) => {
  const now = new Date().toISOString();

  const [invite] = await db
    .select({
      id: merchantPortalInvites.id,
      email: merchantPortalInvites.email,
      merchantId: merchantPortalInvites.merchantId,
      teamId: merchantPortalInvites.teamId,
      code: merchantPortalInvites.code,
      status: merchantPortalInvites.status,
      expiresAt: merchantPortalInvites.expiresAt,
      // Merchant info
      merchantName: merchants.name,
      // Team info
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
    })
    .from(merchantPortalInvites)
    .where(
      and(
        eq(merchantPortalInvites.code, params.code),
        eq(merchantPortalInvites.status, "pending"),
        gt(merchantPortalInvites.expiresAt, now),
      ),
    )
    .leftJoin(merchants, eq(merchants.id, merchantPortalInvites.merchantId))
    .leftJoin(teams, eq(teams.id, merchantPortalInvites.teamId))
    .limit(1);

  return invite;
};

type AcceptMerchantInviteParams = {
  code: string;
  userId: string;
};

export const acceptMerchantInvite = async (
  db: Database,
  params: AcceptMerchantInviteParams,
) => {
  const invite = await getMerchantInviteByCode(db, { code: params.code });

  if (!invite) {
    return null;
  }

  // Create access record
  const [access] = await db
    .insert(merchantPortalAccess)
    .values({
      userId: params.userId,
      merchantId: invite.merchantId,
      teamId: invite.teamId,
    })
    .onConflictDoNothing()
    .returning();

  // Mark invite as accepted
  await db
    .update(merchantPortalInvites)
    .set({
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    })
    .where(eq(merchantPortalInvites.id, invite.id));

  return access;
};

type GetMerchantInvitesByTeamParams = {
  teamId: string;
  merchantId?: string;
  status?: string;
};

export const getMerchantInvitesByTeam = async (
  db: Database,
  params: GetMerchantInvitesByTeamParams,
) => {
  const conditions = [eq(merchantPortalInvites.teamId, params.teamId)];

  if (params.merchantId) {
    conditions.push(eq(merchantPortalInvites.merchantId, params.merchantId));
  }

  if (params.status) {
    conditions.push(eq(merchantPortalInvites.status, params.status as typeof merchantPortalInvites.status.enumValues[number]));
  }

  const invites = await db
    .select({
      id: merchantPortalInvites.id,
      email: merchantPortalInvites.email,
      merchantId: merchantPortalInvites.merchantId,
      code: merchantPortalInvites.code,
      status: merchantPortalInvites.status,
      createdAt: merchantPortalInvites.createdAt,
      expiresAt: merchantPortalInvites.expiresAt,
      merchantName: merchants.name,
      inviterName: users.fullName,
    })
    .from(merchantPortalInvites)
    .where(and(...conditions))
    .leftJoin(merchants, eq(merchants.id, merchantPortalInvites.merchantId))
    .leftJoin(users, eq(users.id, merchantPortalInvites.invitedBy));

  return invites;
};

export const revokeMerchantInvite = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .update(merchantPortalInvites)
    .set({ status: "revoked" })
    .where(
      and(
        eq(merchantPortalInvites.id, params.id),
        eq(merchantPortalInvites.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

// ============================================================================
// Merchant Portal Access Queries
// ============================================================================

type GetMerchantAccessParams = {
  userId: string;
};

export const getMerchantAccess = async (
  db: Database,
  params: GetMerchantAccessParams,
) => {
  const access = await db
    .select({
      id: merchantPortalAccess.id,
      merchantId: merchantPortalAccess.merchantId,
      teamId: merchantPortalAccess.teamId,
      status: merchantPortalAccess.status,
      createdAt: merchantPortalAccess.createdAt,
      // Merchant info
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      portalId: merchants.portalId,
      // Team info
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
    })
    .from(merchantPortalAccess)
    .where(
      and(
        eq(merchantPortalAccess.userId, params.userId),
        eq(merchantPortalAccess.status, "active"),
      ),
    )
    .leftJoin(merchants, eq(merchants.id, merchantPortalAccess.merchantId))
    .leftJoin(teams, eq(teams.id, merchantPortalAccess.teamId));

  return access;
};

type GetMerchantAccessByMerchantParams = {
  merchantId: string;
  teamId: string;
};

export const getMerchantAccessByMerchant = async (
  db: Database,
  params: GetMerchantAccessByMerchantParams,
) => {
  const access = await db
    .select({
      id: merchantPortalAccess.id,
      userId: merchantPortalAccess.userId,
      status: merchantPortalAccess.status,
      createdAt: merchantPortalAccess.createdAt,
      revokedAt: merchantPortalAccess.revokedAt,
      revokedReason: merchantPortalAccess.revokedReason,
      // User info
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(merchantPortalAccess)
    .where(
      and(
        eq(merchantPortalAccess.merchantId, params.merchantId),
        eq(merchantPortalAccess.teamId, params.teamId),
      ),
    )
    .leftJoin(users, eq(users.id, merchantPortalAccess.userId));

  return access;
};

type RevokeMerchantAccessParams = {
  id: string;
  teamId: string;
  revokedBy: string;
  reason?: string;
};

export const revokeMerchantAccess = async (
  db: Database,
  params: RevokeMerchantAccessParams,
) => {
  const [result] = await db
    .update(merchantPortalAccess)
    .set({
      status: "revoked",
      revokedAt: new Date().toISOString(),
      revokedBy: params.revokedBy,
      revokedReason: params.reason,
    })
    .where(
      and(
        eq(merchantPortalAccess.id, params.id),
        eq(merchantPortalAccess.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

// ============================================================================
// Payoff Letter Request Queries
// ============================================================================

type CreatePayoffLetterRequestParams = {
  dealId: string;
  merchantId: string;
  teamId: string;
  requestedPayoffDate: string;
  requestedByEmail: string;
  balanceAtRequest: number;
  payoffAmount: number;
};

export const createPayoffLetterRequest = async (
  db: Database,
  params: CreatePayoffLetterRequestParams,
) => {
  const [request] = await db
    .insert(payoffLetterRequests)
    .values({
      dealId: params.dealId,
      merchantId: params.merchantId,
      teamId: params.teamId,
      requestedPayoffDate: params.requestedPayoffDate,
      requestedByEmail: params.requestedByEmail,
      balanceAtRequest: params.balanceAtRequest,
      payoffAmount: params.payoffAmount,
    })
    .returning();

  return request;
};

type GetPayoffLetterRequestsParams = {
  teamId: string;
  merchantId?: string;
  dealId?: string;
  status?: string;
};

export const getPayoffLetterRequests = async (
  db: Database,
  params: GetPayoffLetterRequestsParams,
) => {
  const conditions = [eq(payoffLetterRequests.teamId, params.teamId)];

  if (params.merchantId) {
    conditions.push(eq(payoffLetterRequests.merchantId, params.merchantId));
  }

  if (params.dealId) {
    conditions.push(eq(payoffLetterRequests.dealId, params.dealId));
  }

  if (params.status) {
    conditions.push(eq(payoffLetterRequests.status, params.status as typeof payoffLetterRequests.status.enumValues[number]));
  }

  const requests = await db
    .select({
      id: payoffLetterRequests.id,
      createdAt: payoffLetterRequests.createdAt,
      dealId: payoffLetterRequests.dealId,
      merchantId: payoffLetterRequests.merchantId,
      requestedPayoffDate: payoffLetterRequests.requestedPayoffDate,
      requestedByEmail: payoffLetterRequests.requestedByEmail,
      balanceAtRequest: payoffLetterRequests.balanceAtRequest,
      payoffAmount: payoffLetterRequests.payoffAmount,
      status: payoffLetterRequests.status,
      approvedAt: payoffLetterRequests.approvedAt,
      sentAt: payoffLetterRequests.sentAt,
      documentPath: payoffLetterRequests.documentPath,
      expiresAt: payoffLetterRequests.expiresAt,
      // Deal info
      dealCode: mcaDeals.dealCode,
      // Merchant info
      merchantName: merchants.name,
    })
    .from(payoffLetterRequests)
    .where(and(...conditions))
    .leftJoin(mcaDeals, eq(mcaDeals.id, payoffLetterRequests.dealId))
    .leftJoin(merchants, eq(merchants.id, payoffLetterRequests.merchantId));

  return requests;
};

type ApprovePayoffLetterRequestParams = {
  id: string;
  teamId: string;
  approvedBy: string;
  documentPath?: string;
  expiresAt?: string;
};

export const approvePayoffLetterRequest = async (
  db: Database,
  params: ApprovePayoffLetterRequestParams,
) => {
  const [result] = await db
    .update(payoffLetterRequests)
    .set({
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: params.approvedBy,
      documentPath: params.documentPath,
      expiresAt: params.expiresAt,
    })
    .where(
      and(
        eq(payoffLetterRequests.id, params.id),
        eq(payoffLetterRequests.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

export const rejectPayoffLetterRequest = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .update(payoffLetterRequests)
    .set({ status: "rejected" })
    .where(
      and(
        eq(payoffLetterRequests.id, params.id),
        eq(payoffLetterRequests.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

// ============================================================================
// Payoff Letter Requests — Portal-facing (public, validated by portalId)
// ============================================================================

type GetPayoffRequestsByPortalParams = {
  portalId: string;
};

export const getPayoffRequestsByPortal = async (
  db: Database,
  params: GetPayoffRequestsByPortalParams,
) => {
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.portalId, params.portalId))
    .limit(1);

  if (!merchant) return [];

  const requests = await db
    .select({
      id: payoffLetterRequests.id,
      createdAt: payoffLetterRequests.createdAt,
      dealId: payoffLetterRequests.dealId,
      requestedPayoffDate: payoffLetterRequests.requestedPayoffDate,
      balanceAtRequest: payoffLetterRequests.balanceAtRequest,
      payoffAmount: payoffLetterRequests.payoffAmount,
      status: payoffLetterRequests.status,
      approvedAt: payoffLetterRequests.approvedAt,
      sentAt: payoffLetterRequests.sentAt,
      documentPath: payoffLetterRequests.documentPath,
      expiresAt: payoffLetterRequests.expiresAt,
      dealCode: mcaDeals.dealCode,
    })
    .from(payoffLetterRequests)
    .where(eq(payoffLetterRequests.merchantId, merchant.id))
    .leftJoin(mcaDeals, eq(mcaDeals.id, payoffLetterRequests.dealId))
    .orderBy(desc(payoffLetterRequests.createdAt));

  return requests;
};

// ============================================================================
// Merchant Messages Queries
// ============================================================================

type CreateMerchantMessageParams = {
  merchantId: string;
  teamId: string;
  direction: "inbound" | "outbound";
  subject?: string;
  message: string;
  fromEmail?: string;
  fromName?: string;
  sessionId?: string;
  sentByUserId?: string;
};

export const createMerchantMessage = async (
  db: Database,
  params: CreateMerchantMessageParams,
) => {
  const [result] = await db
    .insert(merchantMessages)
    .values({
      merchantId: params.merchantId,
      teamId: params.teamId,
      direction: params.direction,
      subject: params.subject,
      message: params.message,
      fromEmail: params.fromEmail,
      fromName: params.fromName,
      sessionId: params.sessionId,
      sentByUserId: params.sentByUserId,
    })
    .returning();

  return result;
};

type GetMerchantMessagesParams = {
  merchantId: string;
  limit?: number;
};

export const getMerchantMessages = async (
  db: Database,
  params: GetMerchantMessagesParams,
) => {
  const messages = await db
    .select()
    .from(merchantMessages)
    .where(eq(merchantMessages.merchantId, params.merchantId))
    .orderBy(desc(merchantMessages.createdAt))
    .limit(params.limit || 50);

  return messages;
};

type GetMerchantMessagesByPortalParams = {
  portalId: string;
  limit?: number;
};

export const getMerchantMessagesByPortal = async (
  db: Database,
  params: GetMerchantMessagesByPortalParams,
) => {
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.portalId, params.portalId))
    .limit(1);

  if (!merchant) return [];

  return getMerchantMessages(db, {
    merchantId: merchant.id,
    limit: params.limit,
  });
};

// ============================================================================
// Merchant Documents Queries
// ============================================================================

type CreateMerchantDocumentParams = {
  merchantId: string;
  teamId: string;
  dealId?: string;
  documentType: "contract" | "disclosure" | "payoff_letter" | "monthly_statement" | "tax_doc" | "other";
  title: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  uploadedBy?: string;
};

export const createMerchantDocument = async (
  db: Database,
  params: CreateMerchantDocumentParams,
) => {
  const [result] = await db
    .insert(merchantDocuments)
    .values({
      merchantId: params.merchantId,
      teamId: params.teamId,
      dealId: params.dealId,
      documentType: params.documentType,
      title: params.title,
      description: params.description,
      filePath: params.filePath,
      fileName: params.fileName,
      fileSize: params.fileSize,
      uploadedBy: params.uploadedBy,
    })
    .returning();

  return result;
};

type GetMerchantDocumentsByPortalParams = {
  portalId: string;
  documentType?: string;
};

export const getMerchantDocumentsByPortal = async (
  db: Database,
  params: GetMerchantDocumentsByPortalParams,
) => {
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.portalId, params.portalId))
    .limit(1);

  if (!merchant) return [];

  const conditions = [
    eq(merchantDocuments.merchantId, merchant.id),
    eq(merchantDocuments.visibleInPortal, true),
  ];

  if (params.documentType) {
    conditions.push(
      eq(
        merchantDocuments.documentType,
        params.documentType as typeof merchantDocuments.documentType.enumValues[number],
      ),
    );
  }

  const docs = await db
    .select({
      id: merchantDocuments.id,
      createdAt: merchantDocuments.createdAt,
      documentType: merchantDocuments.documentType,
      title: merchantDocuments.title,
      description: merchantDocuments.description,
      filePath: merchantDocuments.filePath,
      fileName: merchantDocuments.fileName,
      fileSize: merchantDocuments.fileSize,
      dealId: merchantDocuments.dealId,
      dealCode: mcaDeals.dealCode,
    })
    .from(merchantDocuments)
    .where(and(...conditions))
    .leftJoin(mcaDeals, eq(mcaDeals.id, merchantDocuments.dealId))
    .orderBy(desc(merchantDocuments.createdAt));

  return docs;
};

// ============================================================================
// Merchant Notifications Queries
// ============================================================================

type CreateMerchantNotificationParams = {
  merchantId: string;
  teamId: string;
  notificationType:
    | "payment_received"
    | "payment_nsf"
    | "payoff_approved"
    | "message_received"
    | "document_uploaded"
    | "balance_alert"
    | "deal_paid_off"
    | "general";
  title: string;
  message: string;
  dealId?: string;
  paymentId?: string;
};

export const createMerchantNotification = async (
  db: Database,
  params: CreateMerchantNotificationParams,
) => {
  const [result] = await db
    .insert(merchantNotifications)
    .values({
      merchantId: params.merchantId,
      teamId: params.teamId,
      notificationType: params.notificationType,
      title: params.title,
      message: params.message,
      dealId: params.dealId,
      paymentId: params.paymentId,
    })
    .returning();

  return result;
};

type GetMerchantNotificationsByPortalParams = {
  portalId: string;
  limit?: number;
};

export const getMerchantNotificationsByPortal = async (
  db: Database,
  params: GetMerchantNotificationsByPortalParams,
) => {
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.portalId, params.portalId))
    .limit(1);

  if (!merchant) return [];

  const notifications = await db
    .select()
    .from(merchantNotifications)
    .where(eq(merchantNotifications.merchantId, merchant.id))
    .orderBy(desc(merchantNotifications.createdAt))
    .limit(params.limit || 20);

  return notifications;
};

type GetUnreadNotificationCountParams = {
  portalId: string;
};

export const getUnreadNotificationCount = async (
  db: Database,
  params: GetUnreadNotificationCountParams,
) => {
  const [merchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.portalId, params.portalId))
    .limit(1);

  if (!merchant) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(merchantNotifications)
    .where(
      and(
        eq(merchantNotifications.merchantId, merchant.id),
        eq(merchantNotifications.readInPortal, false),
      ),
    );

  return result?.count || 0;
};

export const markNotificationRead = async (
  db: Database,
  params: { notificationId: string },
) => {
  const [result] = await db
    .update(merchantNotifications)
    .set({
      readInPortal: true,
      readAt: new Date().toISOString(),
    })
    .where(eq(merchantNotifications.id, params.notificationId))
    .returning();

  return result;
};
