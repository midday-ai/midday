import type { Database } from "@db/client";
import { apiKeys, users } from "@db/schema";
import { generateApiKey } from "@db/utils/api-keys";
import { apiKeyCache } from "@midday/cache/api-key-cache";
import { encrypt, hash } from "@midday/encryption";
import { and, eq } from "drizzle-orm";

export type ApiKey = {
  id: string;
  name: string;
  userId: string;
  teamId: string;
  createdAt: string;
  scopes: string[] | null;
};

export async function getApiKeyByToken(db: Database, keyHash: string) {
  const [result] = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      userId: apiKeys.userId,
      teamId: apiKeys.teamId,
      createdAt: apiKeys.createdAt,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  return result;
}

type UpsertApiKeyData = {
  id?: string;
  name: string;
  userId: string;
  teamId: string;
  scopes: string[];
};

export async function upsertApiKey(db: Database, data: UpsertApiKeyData) {
  if (data.id) {
    const [result] = await db
      .update(apiKeys)
      .set({
        name: data.name,
        scopes: data.scopes,
      })
      .where(eq(apiKeys.id, data.id))
      .returning({
        keyHash: apiKeys.keyHash,
      });

    // Delete from cache
    if (result?.keyHash) {
      apiKeyCache.delete(result.keyHash);
    }

    // On update we don't return the key
    return {
      key: null,
    };
  }

  const key = generateApiKey();
  const keyEncrypted = encrypt(key);
  const keyHash = hash(key);

  const [result] = await db
    .insert(apiKeys)
    .values({
      keyEncrypted,
      keyHash,
      name: data.name,
      userId: data.userId,
      teamId: data.teamId,
      scopes: data.scopes,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });

  return {
    key,
    data: result,
  };
}

export async function getApiKeysByTeam(db: Database, teamId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(apiKeys)
    .leftJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.teamId, teamId))
    .orderBy(apiKeys.createdAt);
}

type DeleteApiKeyParams = {
  id: string;
  teamId: string;
};

export async function deleteApiKey(db: Database, params: DeleteApiKeyParams) {
  const [result] = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, params.id), eq(apiKeys.teamId, params.teamId)))
    .returning({
      keyHash: apiKeys.keyHash,
    });

  if (result?.keyHash) {
    apiKeyCache.delete(result.keyHash);
  }
}

export async function updateApiKeyLastUsedAt(db: Database, id: string) {
  return db
    .update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, id));
}
