import { DrizzleDB } from '@/db';
import { eq, like, or } from 'drizzle-orm';
import { users, type NewUser, type User } from '../db/schema';

/**
 * Repository class for managing user data in the database.
 */
export class UserRepository {
	private db: DrizzleDB;

	/**
	 * Creates a new UserRepository instance.
	 * @param d1 - The D1 database instance to use for database operations.
	*/
	constructor(d1: DrizzleDB) {
		this.db = d1;
	}

	/**
	 * Creates a new user in the database.
	 * @param user - The new user data to be inserted.
	 * @returns A Promise that resolves to the created User object.
	 */
	async create(user: NewUser): Promise<User> {
		return this.db.transaction(async (tx) => {
			const [createdUser] = await tx.insert(users).values({
				...user,
				createdAt: new Date(),
				updatedAt: new Date(),
			}).returning();
			return this.mapToUser(createdUser);
		});
	}

	/**
	 * Retrieves a user by their ID.
	 * @param id - The ID of the user to retrieve.
	 * @returns A Promise that resolves to the User object if found, or null if not found.
	 */
	async getById(id: string): Promise<User | null> {
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
	async update(id: string, user: Partial<User>): Promise<User | null> {
		return this.db.transaction(async (tx) => {
			const [updatedUser] = await tx.update(users)
				.set({ ...user, updatedAt: new Date() })
				.where(eq(users.id, id))
				.returning();
			return updatedUser ? this.mapToUser(updatedUser) : null;
		});
	}

	/**
	 * Deletes a user from the database.
	 * @param id - The ID of the user to delete.
	 * @returns A Promise that resolves to true if the user was deleted, or false if not found.
	 */
	async delete(id: string): Promise<boolean> {
		return this.db.transaction(async (tx) => {
			const result = await tx.delete(users)
				.where(eq(users.id, id))
				.returning();
			return result.length > 0;
		});
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
			preferences: row.preferences,
			role: row.role,
			avatarUrl: row.avatarUrl,
			bio: row.bio,
			phoneNumber: row.phoneNumber,
			isEmailVerified: row.isEmailVerified,
			lastLoginAt: row.lastLoginAt,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
		};
	}
}