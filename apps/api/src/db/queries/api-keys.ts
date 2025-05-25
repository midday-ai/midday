import type { Database } from "@api/db";
import { apiKeys } from "@api/db/schema";
import { and, eq } from "drizzle-orm";

export async function getApiKeyByHash(db: Database, keyHash: string) {
  const [result] = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      userId: apiKeys.userId,
      teamId: apiKeys.teamId,
      isActive: apiKeys.isActive,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  return result;
}

type CreateApiKeyData = {
  keyEncrypted: string;
  keyHash: string;
  name?: string;
  userId: string;
  teamId: string;
};

export async function createApiKey(db: Database, data: CreateApiKeyData) {
  return await db
    .insert(apiKeys)
    .values({
      keyEncrypted: data.keyEncrypted,
      keyHash: data.keyHash,
      name: data.name,
      userId: data.userId,
      teamId: data.teamId,
      isActive: true,
    })
    .returning();
}

export async function getApiKeysByTeam(db: Database, teamId: string) {
  return await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      isActive: apiKeys.isActive,
    })
    .from(apiKeys)
    .where(eq(apiKeys.teamId, teamId))
    .orderBy(apiKeys.createdAt);
}

export async function deleteApiKey(
  db: Database,
  keyId: string,
  teamId: string,
) {
  return await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)));
}

export async function deactivateApiKey(
  db: Database,
  keyId: string,
  teamId: string,
) {
  return await db
    .update(apiKeys)
    .set({
      isActive: false,
    })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)));
}
