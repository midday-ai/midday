import { eq, like, or, sql } from 'drizzle-orm';
import { DatabaseClient, DrizzleDB } from '../db/client';
import { users, type NewUser, type User } from '../db/schema';
import { apiKeys } from '../db/schema/api-keys';

/**
 * Repository class for managing user data in the database.
 */
export class UserRepository {
	private db: DrizzleDB;
	private dbC: DatabaseClient;

	/**
	 * Creates a new UserRepository instance.
	 * @param d1 - The D1 database instance to use for database operations.
	*/
	constructor(d1: DrizzleDB) {
		this.db = d1;
		this.dbC = new DatabaseClient(d1);
	}

	/**
	 * Creates a new user in the database.
	 * @param user - The new user data to be inserted.
	 * @returns A Promise that resolves to the created User object.
	 */
	async create(user: NewUser): Promise<User> {
		const [createdUser] = await this.db.insert(users).values({
			email: user.email,
			name: user.name,
			passwordHash: user.passwordHash,
			role: user.role,
			avatarUrl: user.avatarUrl,
			bio: user.bio,
			phoneNumber: user.phoneNumber,
			isEmailVerified: user.isEmailVerified,
			lastLoginAt: user.lastLoginAt,
			status: user.status,
		}).returning();
		return this.mapToUser(createdUser);
	}

	/**
	 * Retrieves a user by their ID.
	 * @param id - The ID of the user to retrieve.
	 * @returns A Promise that resolves to the User object if found, or null if not found.
	 */
	async getById(id: number): Promise<User | null> {
		const [user] = await this.db.select().from(users).where(eq(users.id, id));
		return user ? this.mapToUser(user) : null;
	}
	

	/**
	 * Retrieves a user by their email address.
	 * @param email - The email address of the user to retrieve.
	 * @returns A Promise that resolves to the User object if found, or null if not found.
	 */
	async getByEmail(email: string): Promise<User | null> {
		const [user] = await this.db.select().from(users).where(eq(users.email, email));
		return user ? this.mapToUser(user) : null;
	}

	/**
	 * Updates an existing user in the database.
	 * @param id - The ID of the user to update.
	 * @param user - An object containing the user properties to update.
	 * @returns A Promise that resolves to the updated User object if found, or null if not found.
	 */
	async update(id: number, user: Partial<User>): Promise<User | null> {
		try {
			// Ensure preferences is properly stringified if it exists
			const updateData = {
				...user,
				updatedAt: new Date(),
			};
			const [updatedUser] = await this.db.update(users)
				.set({
					...updateData,
				})
				.where(eq(users.id, id))
				.returning();

			return updatedUser ? this.mapToUser(updatedUser) : null;
		} catch (error) {
			console.error('Error updating user:', error);
			throw error;
		}
	}

	/**
	 * Deletes a user and all associated data from the database.
	 * @param id - The ID of the user to delete.
	 * @returns A Promise that resolves to true if the user was deleted, or false if not found.
	 */
	async delete(id: number): Promise<boolean> {
		try {
			// First, delete all associated API keys
			await this.db.delete(apiKeys)
				.where(eq(apiKeys.userId, id));

			// Then delete the user
			const result = await this.db.delete(users)
				.where(eq(users.id, id))
				.returning();

			return result.length > 0;
		} catch (error) {
			console.error('Error deleting user:', error);
			throw error;
		}
	}

	/**
	 * Safely deletes a user and all associated data from the database.
	 * This method ensures all related records are deleted first.
	 * @param id - The ID of the user to delete.
	 * @returns A Promise that resolves to true if the user was deleted, or false if not found.
	 */
	async safeDelete(id: number): Promise<boolean> {
		try {
			// Check if user exists
			const user = await this.getById(id);
			if (!user) {
				return false;
			}

			return await this.db.transaction(async (tx) => {
				// Delete all associated records in the correct order

				// 1. Delete API keys
				await tx.delete(apiKeys)
					.where(eq(apiKeys.userId, id));

				// 2. Delete any other related records here...
				// await tx.delete(otherTable).where(eq(otherTable.userId, id));

				// Finally, delete the user
				const result = await tx.delete(users)
					.where(eq(users.id, id))
					.returning();

				return result.length > 0;
			});
		} catch (error) {
			console.error('Error safely deleting user:', error);
			throw error;
		}
	}

	/**
	 * Checks if a user has any dependent records.
	 * @param id - The ID of the user to check.
	 * @returns A Promise that resolves to true if the user has dependent records.
	 */
	async hasDependentRecords(id: number): Promise<boolean> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(apiKeys)
			.where(eq(apiKeys.userId, id));

		return result.count > 0;
	}

	/**
	 * Retrieves a list of users with pagination.
	 * @param limit - The maximum number of users to retrieve (default: 50).
	 * @param offset - The number of users to skip before starting to retrieve (default: 0).
	 * @returns A Promise that resolves to an array of User objects.
	 */
	async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
		const result = await this.db.select().from(users)
			.limit(limit)
			.offset(offset);
		return result.map(this.mapToUser);
	}

	/**
	 * Searches for users by name or email.
	 * @param search - The search string to match against user names or emails.
	 * @returns A Promise that resolves to an array of User objects matching the search criteria.
	 */
	async findByNameOrEmail(search: string): Promise<User[]> {
		const result = await this.db.select().from(users)
			.where(
				or(
					like(users.name, `%${search}%`),
					like(users.email, `%${search}%`)
				)
			);
		return result.map(this.mapToUser);
	}

	/**
	 * Maps a database row to a User object.
	 * @param row - The database row containing user data.
	 * @returns A User object with properties mapped from the database row.
	 */
	private mapToUser(row: typeof users.$inferSelect): User {
		return {
			id: row.id,
			email: row.email,
			name: row.name,
			passwordHash: row.passwordHash,
			status: row.status,
			role: row.role,
			avatarUrl: row.avatarUrl,
			bio: row.bio,
			phoneNumber: row.phoneNumber,
			isEmailVerified: row.isEmailVerified,
			lastLoginAt: row.lastLoginAt,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
