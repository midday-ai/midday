import type { Database } from "@api/db";
import { oauthApplications, users } from "@api/db/schema";
import { hash } from "@midday/encryption";
import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export type OAuthApplication = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  redirectUris: string[];
  clientId: string;
  scopes: string[];
  teamId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  active: boolean;
};

export type CreateOAuthApplicationParams = {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  redirectUris: string[];
  scopes: string[];
  teamId: string;
  createdBy: string;
  isPublic?: boolean;
};

export type UpdateOAuthApplicationParams = {
  id: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  redirectUris?: string[];
  scopes?: string[];
  isPublic?: boolean;
  active?: boolean;
  teamId: string;
};

export type DeleteOAuthApplicationParams = {
  id: string;
  teamId: string;
};

// Generate client credentials
function generateClientCredentials() {
  const clientId = `mid_client_${nanoid(24)}`;
  const clientSecret = `mid_app_secret_${nanoid(32)}`;
  const clientSecretHash = hash(clientSecret);

  return {
    clientId,
    clientSecret, // Return plain text for initial response
    clientSecretHash, // Store hash in database
  };
}

// Create OAuth application
export async function createOAuthApplication(
  db: Database,
  params: CreateOAuthApplicationParams,
) {
  const { clientId, clientSecret, clientSecretHash } =
    generateClientCredentials();

  const [result] = await db
    .insert(oauthApplications)
    .values({
      ...params,
      clientId,
      clientSecret: clientSecretHash, // Store hashed secret
    })
    .returning({
      id: oauthApplications.id,
      name: oauthApplications.name,
      description: oauthApplications.description,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
    });

  return {
    ...result,
    clientSecret, // Return plain text secret only once
  };
}

// Get OAuth applications for a team
export async function getOAuthApplicationsByTeam(db: Database, teamId: string) {
  return db
    .select({
      id: oauthApplications.id,
      name: oauthApplications.name,
      description: oauthApplications.description,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(oauthApplications)
    .leftJoin(users, eq(oauthApplications.createdBy, users.id))
    .where(eq(oauthApplications.teamId, teamId))
    .orderBy(desc(oauthApplications.createdAt));
}

// Get OAuth application by ID
export async function getOAuthApplicationById(
  db: Database,
  id: string,
  teamId: string,
) {
  const [result] = await db
    .select({
      id: oauthApplications.id,
      name: oauthApplications.name,
      description: oauthApplications.description,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(oauthApplications)
    .leftJoin(users, eq(oauthApplications.createdBy, users.id))
    .where(
      and(eq(oauthApplications.id, id), eq(oauthApplications.teamId, teamId)),
    )
    .limit(1);

  return result;
}

// Get OAuth application by client ID
export async function getOAuthApplicationByClientId(
  db: Database,
  clientId: string,
) {
  const [result] = await db
    .select({
      id: oauthApplications.id,
      name: oauthApplications.name,
      description: oauthApplications.description,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      clientSecret: oauthApplications.clientSecret,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
    })
    .from(oauthApplications)
    .where(eq(oauthApplications.clientId, clientId))
    .limit(1);

  return result;
}

// Update OAuth application
export async function updateOAuthApplication(
  db: Database,
  params: UpdateOAuthApplicationParams,
) {
  const { id, teamId, ...updateData } = params;

  const [result] = await db
    .update(oauthApplications)
    .set({
      ...updateData,
      updatedAt: sql`NOW()`,
    })
    .where(
      and(eq(oauthApplications.id, id), eq(oauthApplications.teamId, teamId)),
    )
    .returning({
      id: oauthApplications.id,
      name: oauthApplications.name,
      description: oauthApplications.description,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
    });

  return result;
}

// Delete OAuth application
export async function deleteOAuthApplication(
  db: Database,
  params: DeleteOAuthApplicationParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .delete(oauthApplications)
    .where(
      and(eq(oauthApplications.id, id), eq(oauthApplications.teamId, teamId)),
    )
    .returning({
      id: oauthApplications.id,
      name: oauthApplications.name,
    });

  return result;
}

// Regenerate client secret
export async function regenerateClientSecret(
  db: Database,
  id: string,
  teamId: string,
) {
  const clientSecret = `mid_app_secret_${nanoid(32)}`;
  const clientSecretHash = hash(clientSecret);

  const [result] = await db
    .update(oauthApplications)
    .set({
      clientSecret: clientSecretHash, // Store hashed secret
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(oauthApplications.id, id), eq(oauthApplications.teamId, teamId)),
    )
    .returning({
      id: oauthApplications.id,
      clientId: oauthApplications.clientId,
    });

  if (!result) {
    return null;
  }

  return {
    ...result,
    clientSecret, // Return plain text secret only once
  };
}
