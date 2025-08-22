import type { Database } from "@db/client";
import { oauthApplications, users } from "@db/schema";
import { hash } from "@midday/encryption";
import slugify from "@sindresorhus/slugify";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function generateUniqueSlug(db: Database, name: string): Promise<string> {
  const baseSlug = slugify(name, { lowercase: true });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: oauthApplications.id })
      .from(oauthApplications)
      .where(eq(oauthApplications.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export type OAuthApplication = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  overview: string | null;
  developerName: string | null;
  logoUrl: string | null;
  website: string | null;
  installUrl: string | null;
  screenshots: string[];
  redirectUris: string[];
  clientId: string;
  scopes: string[];
  teamId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  active: boolean;
  status: "draft" | "pending" | "approved" | "rejected";
};

export type CreateOAuthApplicationParams = {
  name: string;
  description?: string;
  overview?: string;
  developerName?: string;
  logoUrl?: string;
  website?: string;
  installUrl?: string;
  screenshots?: string[];
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
  overview?: string;
  developerName?: string;
  logoUrl?: string;
  website?: string;
  installUrl?: string;
  screenshots?: string[];
  redirectUris?: string[];
  scopes?: string[];
  isPublic?: boolean;
  active?: boolean;
  status?: "draft" | "pending" | "approved" | "rejected";
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

  // Generate unique slug
  const slug = await generateUniqueSlug(db, params.name);

  const [result] = await db
    .insert(oauthApplications)
    .values({
      ...params,
      slug,
      clientId,
      clientSecret: clientSecretHash, // Store hashed secret
    })
    .returning({
      id: oauthApplications.id,
      name: oauthApplications.name,
      slug: oauthApplications.slug,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      status: oauthApplications.status,
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
      slug: oauthApplications.slug,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      status: oauthApplications.status,
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
      slug: oauthApplications.slug,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      status: oauthApplications.status,
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
      slug: oauthApplications.slug,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
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
      status: oauthApplications.status,
    })
    .from(oauthApplications)
    .where(eq(oauthApplications.clientId, clientId))
    .limit(1);

  return result;
}

// Get OAuth application by slug
export async function getOAuthApplicationBySlug(
  db: Database,
  slug: string,
  teamId: string,
) {
  const [result] = await db
    .select({
      id: oauthApplications.id,
      name: oauthApplications.name,
      slug: oauthApplications.slug,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      status: oauthApplications.status,
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(oauthApplications)
    .leftJoin(users, eq(oauthApplications.createdBy, users.id))
    .where(
      and(
        eq(oauthApplications.slug, slug),
        eq(oauthApplications.teamId, teamId),
      ),
    )
    .limit(1);

  return result;
}

// Update OAuth application
export async function updateOAuthApplication(
  db: Database,
  params: UpdateOAuthApplicationParams,
) {
  const { id, teamId, ...updateData } = params;

  // If name is being updated, regenerate the slug
  let slug: string | undefined;
  if (updateData.name) {
    slug = await generateUniqueSlug(db, updateData.name);
  }

  const [result] = await db
    .update(oauthApplications)
    .set({
      ...updateData,
      ...(slug && { slug }),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(oauthApplications.id, id), eq(oauthApplications.teamId, teamId)),
    )
    .returning({
      id: oauthApplications.id,
      name: oauthApplications.name,
      slug: oauthApplications.slug,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
      redirectUris: oauthApplications.redirectUris,
      clientId: oauthApplications.clientId,
      scopes: oauthApplications.scopes,
      teamId: oauthApplications.teamId,
      createdBy: oauthApplications.createdBy,
      createdAt: oauthApplications.createdAt,
      updatedAt: oauthApplications.updatedAt,
      isPublic: oauthApplications.isPublic,
      active: oauthApplications.active,
      status: oauthApplications.status,
    });

  return result;
}

// Update OAuth application approval status
export async function updateOAuthApplicationstatus(
  db: Database,
  params: {
    id: string;
    teamId: string;
    status: "draft" | "pending" | "approved" | "rejected";
  },
) {
  const { id, teamId, status } = params;

  const [result] = await db
    .update(oauthApplications)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(oauthApplications.id, id), eq(oauthApplications.teamId, teamId)),
    )
    .returning({
      id: oauthApplications.id,
      name: oauthApplications.name,
      status: oauthApplications.status,
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
