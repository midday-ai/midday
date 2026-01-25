import type { Database } from "@db/client";
import {
  customers,
  merchantPortalAccess,
  merchantPortalInvites,
  merchantPortalSessions,
  payoffLetterRequests,
  mcaDeals,
  teams,
  users,
} from "@db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// Merchant Portal Session Queries (Magic Link Auth)
// ============================================================================

type CreateMerchantSessionParams = {
  customerId: string;
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
      customerId: params.customerId,
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

  // Mark as verified and extend expiration to 24 hours
  const newExpiresAt = new Date();
  newExpiresAt.setHours(newExpiresAt.getHours() + 24);

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
      customerId: merchantPortalSessions.customerId,
      portalId: merchantPortalSessions.portalId,
      email: merchantPortalSessions.email,
      verifiedAt: merchantPortalSessions.verifiedAt,
      expiresAt: merchantPortalSessions.expiresAt,
      // Customer info
      customerName: customers.name,
      teamId: customers.teamId,
    })
    .from(merchantPortalSessions)
    .where(
      and(
        eq(merchantPortalSessions.id, params.sessionId),
        gt(merchantPortalSessions.expiresAt, now),
        sql`${merchantPortalSessions.verifiedAt} IS NOT NULL`,
      ),
    )
    .leftJoin(customers, eq(customers.id, merchantPortalSessions.customerId))
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
  customerId: string;
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
        eq(merchantPortalInvites.customerId, params.customerId),
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
      customerId: params.customerId,
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
      customerId: merchantPortalInvites.customerId,
      teamId: merchantPortalInvites.teamId,
      code: merchantPortalInvites.code,
      status: merchantPortalInvites.status,
      expiresAt: merchantPortalInvites.expiresAt,
      // Customer info
      customerName: customers.name,
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
    .leftJoin(customers, eq(customers.id, merchantPortalInvites.customerId))
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
      customerId: invite.customerId,
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
  customerId?: string;
  status?: string;
};

export const getMerchantInvitesByTeam = async (
  db: Database,
  params: GetMerchantInvitesByTeamParams,
) => {
  const conditions = [eq(merchantPortalInvites.teamId, params.teamId)];

  if (params.customerId) {
    conditions.push(eq(merchantPortalInvites.customerId, params.customerId));
  }

  if (params.status) {
    conditions.push(eq(merchantPortalInvites.status, params.status as typeof merchantPortalInvites.status.enumValues[number]));
  }

  const invites = await db
    .select({
      id: merchantPortalInvites.id,
      email: merchantPortalInvites.email,
      customerId: merchantPortalInvites.customerId,
      code: merchantPortalInvites.code,
      status: merchantPortalInvites.status,
      createdAt: merchantPortalInvites.createdAt,
      expiresAt: merchantPortalInvites.expiresAt,
      customerName: customers.name,
      inviterName: users.fullName,
    })
    .from(merchantPortalInvites)
    .where(and(...conditions))
    .leftJoin(customers, eq(customers.id, merchantPortalInvites.customerId))
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
      customerId: merchantPortalAccess.customerId,
      teamId: merchantPortalAccess.teamId,
      status: merchantPortalAccess.status,
      createdAt: merchantPortalAccess.createdAt,
      // Customer info
      customerName: customers.name,
      customerEmail: customers.email,
      portalId: customers.portalId,
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
    .leftJoin(customers, eq(customers.id, merchantPortalAccess.customerId))
    .leftJoin(teams, eq(teams.id, merchantPortalAccess.teamId));

  return access;
};

type GetMerchantAccessByCustomerParams = {
  customerId: string;
  teamId: string;
};

export const getMerchantAccessByCustomer = async (
  db: Database,
  params: GetMerchantAccessByCustomerParams,
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
        eq(merchantPortalAccess.customerId, params.customerId),
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
  customerId: string;
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
      customerId: params.customerId,
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
  customerId?: string;
  dealId?: string;
  status?: string;
};

export const getPayoffLetterRequests = async (
  db: Database,
  params: GetPayoffLetterRequestsParams,
) => {
  const conditions = [eq(payoffLetterRequests.teamId, params.teamId)];

  if (params.customerId) {
    conditions.push(eq(payoffLetterRequests.customerId, params.customerId));
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
      customerId: payoffLetterRequests.customerId,
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
      // Customer info
      customerName: customers.name,
    })
    .from(payoffLetterRequests)
    .where(and(...conditions))
    .leftJoin(mcaDeals, eq(mcaDeals.id, payoffLetterRequests.dealId))
    .leftJoin(customers, eq(customers.id, payoffLetterRequests.customerId));

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
