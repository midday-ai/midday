import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DrizzleDB } from '../db/client';
import { apiKeys, type APIKey } from '../db/schema';

export class APIKeyRepository {
	private db: DrizzleDB;

	constructor(d1: DrizzleDB) {
		this.db = d1;
	}

	/**
	 * Creates a new API key
	 * @param apiKey - The API key data to create
	 * @returns The created API key
	 */
	async create(apiKey: Omit<APIKey, 'id' | 'createdAt'>): Promise<APIKey> {
		const [createdApiKey] = await this.db.insert(apiKeys).values({
			...apiKey,
			createdAt: new Date(),
		}).returning();
		return this.mapToAPIKey(createdApiKey);
	}

	/**
	 * Retrieves an API key by ID
	 * @param id - The ID of the API key
	 * @returns The API key or null if not found
	 */
	async getById(id: number): Promise<APIKey | null> {
		const [apiKey] = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id));
		return apiKey ? this.mapToAPIKey(apiKey) : null;
	}

	/**
	 * Retrieves all API keys for a user
	 * @param userId - The ID of the user
	 * @returns An array of API keys
	 */
	async getByUserId(userId: number): Promise<APIKey[]> {
		const results = await this.db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
		return results.map(this.mapToAPIKey);
	}

	/**
	 * Updates an API key
	 * @param id - The ID of the API key to update
	 * @param apiKey - The partial API key data to update
	 * @returns The updated API key or null if not found
	 */
	async update(id: number, apiKey: Partial<APIKey>): Promise<APIKey | null> {
		const [updatedApiKey] = await this.db.update(apiKeys)
			.set(apiKey)
			.where(eq(apiKeys.id, id))
			.returning();
		return updatedApiKey ? this.mapToAPIKey(updatedApiKey) : null;
	}

	/**
	 * Deletes an API key
	 * @param id - The ID of the API key to delete
	 */
	async delete(id: number): Promise<void> {
		await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
	}

	/**
	 * Retrieves active API keys for a given user
	 * @param userId - The ID of the user
	 * @returns An array of active API keys
	 */
	async getActiveKeysByUserId(userId: number): Promise<APIKey[]> {
		const results = await this.db
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
	}

	/**
	 * Increments the usage count of an API key
	 * @param id - The ID of the API key
	 * @param ip - The IP address that used the key
	 * @returns The updated API key
	 */
	async incrementUsage(id: number, ip: string): Promise<APIKey | null> {
		const [updatedApiKey] = await this.db
			.update(apiKeys)
			.set({
				usageCount: sql`${apiKeys.usageCount} + 1`,
				lastUsedAt: new Date(),
				lastUsedIP: ip,
			})
			.where(eq(apiKeys.id, id))
			.returning();
		return updatedApiKey ? this.mapToAPIKey(updatedApiKey) : null;
	}

	/**
	 * Revokes an API key
	 * @param id - The ID of the API key to revoke
	 * @param reason - The reason for revoking the key
	 * @returns The revoked API key
	 */
	async revokeKey(id: number, reason: string): Promise<APIKey | null> {
		const [revokedApiKey] = await this.db
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
	}

	/**
	 * Retrieves API keys that are expiring soon
	 * @param daysUntilExpiration - Number of days until expiration
	 * @returns An array of soon-to-expire API keys
	 */
	async getExpiringKeys(daysUntilExpiration: number): Promise<APIKey[]> {
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate() + daysUntilExpiration);

		const results = await this.db
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
	}

	/**
	 * Retrieves API keys with high usage
	 * @param threshold - The usage count threshold
	 * @returns An array of API keys with usage count above the threshold
	 */
	async getHighUsageKeys(threshold: number): Promise<APIKey[]> {
		const results = await this.db
			.select()
			.from(apiKeys)
			.where(gte(apiKeys.usageCount, threshold));
		return results.map(this.mapToAPIKey);
	}

	/**
	 * Updates the rate limit for an API key
	 * @param id - The ID of the API key
	 * @param newRateLimit - The new rate limit to set
	 * @returns The updated API key
	 */
	async updateRateLimit(id: number, newRateLimit: number): Promise<APIKey | null> {
		const [updatedApiKey] = await this.db
			.update(apiKeys)
			.set({ rateLimit: newRateLimit })
			.where(eq(apiKeys.id, id))
			.returning();
		return updatedApiKey ? this.mapToAPIKey(updatedApiKey) : null;
	}

	/**
	 * Checks if the provided API key is valid, active, and not revoked
	 * @param apiKey - The API key to validate
	 * @returns A boolean indicating whether the API key is valid
	 */
	async isValidApiKey(apiKey: string): Promise<boolean> {
		const [result] = await this.db
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
