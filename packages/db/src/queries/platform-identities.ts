import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type { Database } from "../client";
import {
  PlatformIdentityAlreadyLinkedToAnotherTeamError,
  PlatformIdentityAlreadyLinkedToAnotherUserError,
} from "../errors";
import { platformIdentities, platformLinkTokens } from "../schema";

export type PlatformProvider = "slack" | "telegram" | "whatsapp" | "sendblue";

type PlatformIdentityRecord = typeof platformIdentities.$inferSelect;

export async function getPlatformIdentity(
  db: Database,
  params: {
    provider: PlatformProvider;
    externalUserId: string;
    externalTeamId?: string | null;
  },
) {
  const [result] = await db
    .select()
    .from(platformIdentities)
    .where(
      and(
        eq(platformIdentities.provider, params.provider),
        eq(platformIdentities.externalUserId, params.externalUserId),
        eq(platformIdentities.externalTeamId, params.externalTeamId ?? ""),
      ),
    )
    .limit(1);

  return result ?? null;
}

export async function getPlatformIdentityForUser(
  db: Database,
  params: {
    provider: PlatformProvider;
    teamId: string;
    userId: string;
  },
) {
  const [result] = await db
    .select()
    .from(platformIdentities)
    .where(
      and(
        eq(platformIdentities.provider, params.provider),
        eq(platformIdentities.teamId, params.teamId),
        eq(platformIdentities.userId, params.userId),
      ),
    )
    .limit(1);

  return result ?? null;
}

export async function getPlatformIdentityById(db: Database, id: string) {
  const [result] = await db
    .select()
    .from(platformIdentities)
    .where(eq(platformIdentities.id, id))
    .limit(1);

  return result ?? null;
}

export async function listPlatformIdentitiesForTeam(
  db: Database,
  params: {
    provider: PlatformProvider;
    teamId: string;
  },
) {
  return db
    .select()
    .from(platformIdentities)
    .where(
      and(
        eq(platformIdentities.provider, params.provider),
        eq(platformIdentities.teamId, params.teamId),
      ),
    );
}

export async function createOrUpdatePlatformIdentity(
  db: Database,
  params: {
    provider: PlatformProvider;
    teamId: string;
    userId: string;
    externalUserId: string;
    externalTeamId?: string | null;
    externalChannelId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const externalTeamId = params.externalTeamId ?? "";
  const existing = await getPlatformIdentity(db, {
    provider: params.provider,
    externalUserId: params.externalUserId,
    externalTeamId,
  });

  if (existing) {
    if (existing.userId !== params.userId) {
      throw new PlatformIdentityAlreadyLinkedToAnotherUserError();
    }

    if (existing.teamId !== params.teamId) {
      throw new PlatformIdentityAlreadyLinkedToAnotherTeamError();
    }

    const [updated] = await db
      .update(platformIdentities)
      .set({
        externalChannelId:
          params.externalChannelId ?? existing.externalChannelId,
        metadata: params.metadata
          ? {
              ...(existing.metadata as Record<string, unknown> | null),
              ...params.metadata,
            }
          : existing.metadata,
        updatedAt: sql`now()`,
      })
      .where(eq(platformIdentities.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(platformIdentities)
    .values({
      provider: params.provider,
      teamId: params.teamId,
      userId: params.userId,
      externalUserId: params.externalUserId,
      externalTeamId,
      externalChannelId: params.externalChannelId ?? null,
      metadata: params.metadata ?? null,
    })
    .returning();

  return created!;
}

export async function updatePlatformIdentityMetadata(
  db: Database,
  params: {
    id: string;
    metadata: Record<string, unknown>;
  },
) {
  const identity = await getPlatformIdentityById(db, params.id);

  if (!identity) {
    return null;
  }

  const [updated] = await db
    .update(platformIdentities)
    .set({
      metadata: {
        ...(identity.metadata as Record<string, unknown> | null),
        ...params.metadata,
      },
      updatedAt: sql`now()`,
    })
    .where(eq(platformIdentities.id, params.id))
    .returning();

  return updated ?? identity;
}

export async function deletePlatformIdentity(
  db: Database,
  params: {
    provider: PlatformProvider;
    externalUserId: string;
    externalTeamId?: string | null;
  },
) {
  const deleted = await db
    .delete(platformIdentities)
    .where(
      and(
        eq(platformIdentities.provider, params.provider),
        eq(platformIdentities.externalUserId, params.externalUserId),
        eq(platformIdentities.externalTeamId, params.externalTeamId ?? ""),
      ),
    )
    .returning();

  return deleted[0] ?? null;
}

export async function deletePlatformIdentitiesForTeam(
  db: Database,
  params: {
    teamId: string;
    provider: PlatformProvider;
  },
) {
  return db
    .delete(platformIdentities)
    .where(
      and(
        eq(platformIdentities.teamId, params.teamId),
        eq(platformIdentities.provider, params.provider),
      ),
    )
    .returning();
}

const LINK_CODE_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generateRawCode = customAlphabet(LINK_CODE_ALPHABET, 8);

function generateLinkCode(): string {
  for (let i = 0; i < 10; i++) {
    const code = generateRawCode();
    if (/[0-9]/.test(code) && /[A-Za-z]/.test(code)) {
      return code;
    }
  }
  const chars = Array.from(generateRawCode());
  chars[0] = LINK_CODE_ALPHABET.charAt(Math.floor(Math.random() * 10));
  chars[1] = LINK_CODE_ALPHABET.charAt(10 + Math.floor(Math.random() * 52));
  return chars.join("");
}

export async function createPlatformLinkToken(
  db: Database,
  params: {
    provider: PlatformProvider;
    teamId: string;
    userId: string;
    expiresAt?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const code = generateLinkCode();
  const expiresAt =
    params.expiresAt ??
    new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  const [token] = await db
    .insert(platformLinkTokens)
    .values({
      code,
      provider: params.provider,
      teamId: params.teamId,
      userId: params.userId,
      expiresAt,
      metadata: params.metadata ?? null,
    })
    .returning();

  return token!;
}

export async function consumePlatformLinkToken(
  db: Database,
  params: {
    provider: PlatformProvider;
    code: string;
  },
) {
  const [token] = await db
    .update(platformLinkTokens)
    .set({
      usedAt: sql`now()`,
    })
    .where(
      and(
        eq(platformLinkTokens.provider, params.provider),
        eq(platformLinkTokens.code, params.code),
        isNull(platformLinkTokens.usedAt),
        gt(platformLinkTokens.expiresAt, sql`now()`),
      ),
    )
    .returning();

  return token ?? null;
}

export async function getPlatformLinkToken(
  db: Database,
  params: {
    provider: PlatformProvider;
    code: string;
  },
) {
  const [token] = await db
    .select()
    .from(platformLinkTokens)
    .where(
      and(
        eq(platformLinkTokens.provider, params.provider),
        eq(platformLinkTokens.code, params.code),
      ),
    )
    .limit(1);

  return token ?? null;
}

export function normalizeExternalTeamId(value?: string | null) {
  return value ?? "";
}

export type PlatformIdentity = PlatformIdentityRecord;
