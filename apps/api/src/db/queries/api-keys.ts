import type { Database } from "@api/db";
import { apiKeys, users } from "@api/db/schema";
import { generateApiKey } from "@api/utils/api-keys";
import { encrypt, hash } from "@midday/encryption";
import { and, eq } from "drizzle-orm";

export async function getApiKeyByToken(db: Database, token: string) {
  const keyHash = hash(token);

  const [result] = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      userId: apiKeys.userId,
      teamId: apiKeys.teamId,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  return result;
}

type CreateApiKeyData = {
  name?: string;
  userId: string;
  teamId: string;
};

export async function createApiKey(db: Database, data: CreateApiKeyData) {
  const keyEncrypted = encrypt(generateApiKey());
  const keyHash = hash(keyEncrypted);

  return db
    .insert(apiKeys)
    .values({
      keyEncrypted,
      keyHash,
      name: data.name,
      userId: data.userId,
      teamId: data.teamId,
    })
    .returning();
}

export async function getApiKeysByTeam(db: Database, teamId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
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
  return db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, params.id), eq(apiKeys.teamId, params.teamId)));
}
