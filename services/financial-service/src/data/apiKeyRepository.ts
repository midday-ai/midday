import { DrizzleDB } from '@/db';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { apiKeys, type APIKey } from '../db/schema';

export class APIKeyRepository {
	private db: DrizzleDB;

	constructor(d1: DrizzleDB) {
		this.db = d1;
	}

	/**
	 * Creates a new API key within a transaction
	 * @param apiKey - The API key data to create
	 * @returns The created API key
	 */
	async create(apiKey: Omit<APIKey, 'id' | 'createdAt'>): Promise<APIKey> {
		return await this.db.transaction(async (tx) => {
			const [createdApiKey] = await tx.insert(apiKeys).values({
				...apiKey,
				id: crypto.randomUUID(),
				createdAt: new Date(),
			}).returning();
			return this.mapToAPIKey(createdApiKey);
		});
	}

	/**
	 * Retrieves an API key by ID within a transaction
	 * @param id - The ID of the API key
	 * @returns The API key or null if not found
	 */
	async getById(id: string): Promise<APIKey | null> {
		return await this.db.transaction(async (tx) => {
			const [apiKey] = await tx.select().from(apiKeys).where(eq(apiKeys.id, id));
			return apiKey ? this.mapToAPIKey(apiKey) : null;
		});
	}

	/**
	 * Retrieves all API keys for a user within a transaction
	 * @param userId - The ID of the user
	 * @returns An array of API keys
	 */
	async getByUserId(userId: string): Promise<APIKey[]> {
		return await this.db.transaction(async (tx) => {
			const results = await tx.select().from(apiKeys).where(eq(apiKeys.userId, userId));
			return results.map(this.mapToAPIKey);
		});
	}

	/**
	 * Updates an API key within a transaction
	 * @param id - The ID of the API key to update
	 * @param apiKey - The partial API key data to update
	 * @returns The updated API key or null if not found
	 */
	async update(id: string, apiKey: Partial<APIKey>): Promise<APIKey | null> {
		return await this.db.transaction(async (tx) => {
			const [updatedApiKey] = await tx.update(apiKeys)
				.set(apiKey)
				.where(eq(apiKeys.id, id))
				.returning();
			return updatedApiKey ? this.mapToAPIKey(updatedApiKey) : null;
		});
	}

	/**
	 * Deletes an API key within a transaction
	 * @param id - The ID of the API key to delete
	 */
	async delete(id: string): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx.delete(apiKeys).where(eq(apiKeys.id, id));
		});
	}

	/**
	 * Retrieves active API keys for a given user within a transaction
	 * @param userId - The ID of the user
	 * @returns An array of active API keys
	 */
	async getActiveKeysByUserId(userId: string): Promise<APIKey[]> {
		return await this.db.transaction(async (tx) => {
			const results = await tx
				.select()
				.from(apiKeys)
				.where(
					and(
						eq(apiKeys.userId, userId),
						eq(apiKeys.isActive, true),
						eq(apiKeys.revoked, false)
					)
				);
			return results.map(this.mapToAPIKey);
		});
	}

	/**
	 * Increments the usage count of an API key within a transaction
	 * @param id - The ID of the API key
	 * @param ip - The IP address that used the key
	 * @returns The updated API key
	 */
	async incrementUsage(id: string, ip: string): Promise<APIKey | null> {
		return await this.db.transaction(async (tx) => {
			const [updatedApiKey] = await tx
				.update(apiKeys)
				.set({
					usageCount: sql`${apiKeys.usageCount} + 1`,
					lastUsedAt: new Date(),
					lastUsedIP: ip,
				})
				.where(eq(apiKeys.id, id))
				.returning();
			return updatedApiKey ? this.mapToAPIKey(updatedApiKey) : null;
		});
	}

	/**
	 * Revokes an API key within a transaction
	 * @param id - The ID of the API key to revoke
	 * @param reason - The reason for revoking the key
	 * @returns The revoked API key
	 */
	async revokeKey(id: string, reason: string): Promise<APIKey | null> {
		return await this.db.transaction(async (tx) => {
			const [revokedApiKey] = await tx
				.update(apiKeys)
				.set({
					revoked: true,
					revokedAt: new Date(),
					revokedReason: reason,
					isActive: false,
				})
				.where(eq(apiKeys.id, id))
				.returning();
			return revokedApiKey ? this.mapToAPIKey(revokedApiKey) : null;
		});
	}

	/**
	 * Retrieves API keys that are expiring soon within a transaction
	 * @param daysUntilExpiration - Number of days until expiration
	 * @returns An array of soon-to-expire API keys
	 */
	async getExpiringKeys(daysUntilExpiration: number): Promise<APIKey[]> {
		return await this.db.transaction(async (tx) => {
			const expirationDate = new Date();
			expirationDate.setDate(expirationDate.getDate() + daysUntilExpiration);

			const results = await tx
				.select()
				.from(apiKeys)
				.where(
					and(
						gte(apiKeys.expiresAt, new Date()),
						lte(apiKeys.expiresAt, expirationDate),
						eq(apiKeys.isActive, true),
						eq(apiKeys.revoked, false)
					)
				);
			return results.map(this.mapToAPIKey);
		});
	}

	/**
	 * Retrieves API keys with high usage within a transaction
	 * @param threshold - The usage count threshold
	 * @returns An array of API keys with usage count above the threshold
	 */
	async getHighUsageKeys(threshold: number): Promise<APIKey[]> {
		return await this.db.transaction(async (tx) => {
			const results = await tx
				.select()
				.from(apiKeys)
				.where(gte(apiKeys.usageCount, threshold));
			return results.map(this.mapToAPIKey);
		});
	}

	/**
	 * Updates the rate limit for an API key within a transaction
	 * @param id - The ID of the API key
	 * @param newRateLimit - The new rate limit to set
	 * @returns The updated API key
	 */
	async updateRateLimit(id: string, newRateLimit: number): Promise<APIKey | null> {
		return await this.db.transaction(async (tx) => {
			const [updatedApiKey] = await tx
				.update(apiKeys)
				.set({ rateLimit: newRateLimit })
				.where(eq(apiKeys.id, id))
				.returning();
			return updatedApiKey ? this.mapToAPIKey(updatedApiKey) : null;
		});
	}

	/**
	 * Checks if the provided API key is valid, active, and not revoked
	 * @param apiKey - The API key to validate
	 * @returns A boolean indicating whether the API key is valid
	 */
	async isValidApiKey(apiKey: string): Promise<boolean> {
		return await this.db.transaction(async (tx) => {
			const [result] = await tx
				.select({ count: sql<number>`count(*)` })
				.from(apiKeys)
				.where(
					and(
						eq(apiKeys.key, apiKey),
						eq(apiKeys.isActive, true),
						eq(apiKeys.revoked, false),
						gte(apiKeys.expiresAt, new Date())
					)
				);
			
			return result.count > 0;
		});
	}

	private mapToAPIKey(row: typeof apiKeys.$inferSelect): APIKey {
		return {
			id: row.id,
			userId: row.userId,
			key: row.key,
			name: row.name,
			usageCount: row.usageCount,
			lastUsedIP: row.lastUsedIP,
			environment: row.environment,
			scope: row.scope,
			rateLimit: row.rateLimit,
			allowedIPs: row.allowedIPs,
			allowedDomains: row.allowedDomains,
			description: row.description,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt),
			expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
			lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt) : null,
			isActive: row.isActive,
			revoked: row.revoked,
			revokedAt: row.revokedAt ? new Date(row.revokedAt) : null,
			revokedReason: row.revokedReason,
			keyId: row.keyId,
		};
	}
}