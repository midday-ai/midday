import { desc, eq, like, or } from "drizzle-orm";
import { Context } from "hono";
import { Bindings } from "../bindings";
import { DatabaseError } from "../errors";
import { ErrorCode } from "../errors/error-code";
import { DatabaseClient, DrizzleDatabase } from "./db";
import * as schema from "./schema";
import { UserAccount } from "./schema";

/**
 * UserAccountDatabaseClient class for managing user account operations in the database.
 * This class follows the singleton pattern and extends DatabaseClient.
 */
export class UserAccountDatabaseClient extends DatabaseClient {
  private static instance: UserAccountDatabaseClient | null = null;

  /**
   * Private constructor to prevent direct construction calls with the `new` operator.
   * @param env - The environment bindings required for database operations.
   */
  private constructor(db: D1Database) {
    super(db);
  }

  /**
   * Gets the singleton instance of UserAccountDatabaseClient.
   * @param env - The environment bindings required for database operations.
   * @returns A Promise that resolves to the UserAccountDatabaseClient instance.
   */
  public static async getInstance(
    db: D1Database,
  ): Promise<UserAccountDatabaseClient> {
    if (!UserAccountDatabaseClient.instance) {
      UserAccountDatabaseClient.instance = new UserAccountDatabaseClient(db);
    }

    return UserAccountDatabaseClient.instance;
  }

  /**
   * Validates an email address.
   * @param email - The email address to validate.
   * @throws {DatabaseError} If the email is invalid.
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "Invalid email address",
      });
    }
  }

  /**
   * Validates a username.
   * @param username - The username to validate.
   * @throws {DatabaseError} If the username is empty or only contains whitespace.
   */
  private validateUsername(username: string): void {
    if (!username.trim()) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "Username is required",
      });
    }
  }

  /**
   * Validates a Supabase Auth0 User ID.
   * @param id - The Supabase Auth0 User ID to validate.
   * @throws {DatabaseError} If the ID is empty or only contains whitespace.
   */
  private validateSupabaseAuth0UserId(id: string): void {
    if (!id.trim()) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "Supabase Auth0 User ID is required",
      });
    }
  }

  /**
   * Checks if a user account exists by email and username.
   * @param email - The email address to check.
   * @param username - The username to check.
   * @returns A Promise that resolves to a boolean indicating whether the user account exists.
   * @throws {DatabaseError} If the email or username is invalid.
   */
  public async checkUserAccountExists(
    email: string,
    username: string,
  ): Promise<boolean> {
    this.validateEmail(email);
    this.validateUsername(username);

    return this.executeQuery(async (db) => {
      const [userAccount] = await db
        .select()
        .from(schema.userAccounts)
        .where(
          or(
            eq(schema.userAccounts.email, email),
            eq(schema.userAccounts.username, username),
          ),
        );
      return !!userAccount;
    });
  }

  /**
   * Creates a new user account.
   * @param ctx - The context object containing services like logger.
   * @param params - An object containing the email, username, and Supabase Auth0 User ID.
   * @returns A Promise that resolves to the created UserAccount.
   * @throws {DatabaseError} If the account creation fails or if a user with the same email or username already exists.
   */
  public async createUserAccount(params: {
    email: string;
    username: string;
    supabaseAuth0UserId: string;
  }): Promise<UserAccount> {
    try {
      this.validateEmail(params.email);
      this.validateUsername(params.username);
      this.validateSupabaseAuth0UserId(params.supabaseAuth0UserId);

      const existingUserAccount = await this.checkUserAccountExists(
        params.email,
        params.username,
      );
      if (existingUserAccount) {
        throw new DatabaseError({
          code: ErrorCode.NOT_UNIQUE,
          message: "User account already exists",
        });
      }

      const [newAccount] = await this.getClient()
        .insert(schema.userAccounts)
        .values(params)
        .returning();

      if (!newAccount) {
        throw new DatabaseError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: "Failed to create user account",
        });
      }

      return newAccount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a user account by Supabase Auth0 User ID, email, or username.
   * @param ctx - The context object containing services like logger.
   * @param params - An object containing optional Supabase Auth0 User ID, email, or username.
   * @returns A Promise that resolves to the UserAccount if found, or null if not found.
   * @throws {DatabaseError} If no search parameter is provided or if there's an error during the database query.
   */
  public async getUserAccountByAuthUserId({
    supabaseAuth0UserId,
    email,
    username,
  }: {
    supabaseAuth0UserId?: string;
    email?: string;
    username?: string;
  }): Promise<UserAccount | null> {
    if (!supabaseAuth0UserId && !email && !username) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "User ID, email or username is required",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const [userAccount] = await db
          .select()
          .from(schema.userAccounts)
          .where(
            or(
              email ? eq(schema.userAccounts.email, email) : undefined,
              username ? eq(schema.userAccounts.username, username) : undefined,
              supabaseAuth0UserId
                ? eq(
                    schema.userAccounts.supabaseAuth0UserId,
                    supabaseAuth0UserId,
                  )
                : undefined,
            ),
          );
        return userAccount || null;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a user account by Supabase Auth0 User ID, email, or username.
   * @param ctx - The context object containing services like logger.
   * @param params - An object containing optional Supabase Auth0 User ID, email, or username.
   * @returns A Promise that resolves to a boolean indicating whether the deletion was successful.
   * @throws {DatabaseError} If no deletion parameter is provided or if there's an error during the database operation.
   */
  public async deleteUserAccount(
    ctx: Context,
    {
      supabaseAuth0UserId,
      email,
      username,
    }: {
      supabaseAuth0UserId?: string;
      email?: string;
      username?: string;
    },
  ): Promise<boolean> {
    const { logger } = ctx.get("services");

    if (!supabaseAuth0UserId && !email && !username) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "User ID, email or username is required for deletion",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const result = await db
          .delete(schema.userAccounts)
          .where(
            or(
              email ? eq(schema.userAccounts.email, email) : undefined,
              username ? eq(schema.userAccounts.username, username) : undefined,
              supabaseAuth0UserId
                ? eq(
                    schema.userAccounts.supabaseAuth0UserId,
                    supabaseAuth0UserId,
                  )
                : undefined,
            ),
          );
        return result.success;
      });
    } catch (error) {
      logger.error("Error deleting user account", {
        supabaseAuth0UserId,
        email,
        username,
        error,
      });
      throw error;
    }
  }

  /**
   * Retrieves a user account by its ID.
   * @param id The ID of the user account to retrieve.
   * @returns The user account if found, null otherwise.
   * @throws {DatabaseError} If the user ID is not provided or if there's an error during the database query.
   */
  async getUserAccountById(id: number): Promise<UserAccount | null> {
    if (!id) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "User ID is required",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const [userAccount] = await db
          .select()
          .from(schema.userAccounts)
          .where(eq(schema.userAccounts.id, id));
        return userAccount || null;
      });
    } catch (error) {
      throw new DatabaseError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: `Failed to get user account by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Retrieves a user account by email or username.
   * @param identifier The email or username of the user account to retrieve.
   * @returns The user account if found, null otherwise.
   */
  async getUserAccountByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<UserAccount | null> {
    if (!email && !username) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "Email or username is required",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const [userAccount] = await db
          .select()
          .from(schema.userAccounts)
          .where(
            or(
              eq(schema.userAccounts.email, email),
              eq(schema.userAccounts.username, username),
            ),
          );
        return userAccount || null;
      });
    } catch (error) {
      throw new DatabaseError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: `Failed to get user account by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Updates a user account.
   * @param id The ID of the user account to update.
   * @param updateData The data to update.
   * @returns The updated user account.
   * @throws {DatabaseError} If the update fails.
   */
  async updateUserAccount(
    id: number,
    updateData: Partial<UserAccount>,
  ): Promise<UserAccount> {
    try {
      const [updatedUser] = await this.getClient()
        .update(schema.userAccounts)
        .set(updateData)
        .where(eq(schema.userAccounts.id, id))
        .returning();
      if (!updatedUser) {
        throw new DatabaseError({
          code: "NOT_FOUND",
          message: `User account with ID ${id} not found`,
        });
      }
      return updatedUser;
    } catch (error) {
      throw new DatabaseError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update user account: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Soft deletes a user account by setting isActive to false.
   * @param id The ID of the user account to soft delete.
   * @returns True if the account was soft deleted, false otherwise.
   */
  public async softDeleteUserAccount({ id }: { id: number }): Promise<boolean> {
    if (!id) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "User ID is required for deletion",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const result = await db
          .update(schema.userAccounts)
          .set({ isActive: false })
          .where(eq(schema.userAccounts.id, id))
          .returning({ id: schema.userAccounts.id });
        return !!result;
      });
    } catch (error) {
      throw error;
    }
  }

  async hardDeleteUserAccount({ id }: { id: number }): Promise<boolean> {
    if (!id) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "User ID is required for deletion",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const [result] = await db
          .delete(schema.userAccounts)
          .where(eq(schema.userAccounts.id, id))
          .returning({ id: schema.userAccounts.id });
        return !!result;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifies a user's email.
   * @param id The ID of the user account to verify.
   * @returns The updated user account.
   * @throws {DatabaseError} If the verification fails.
   */
  async verifyUserEmail(id: number): Promise<UserAccount> {
    if (!id) {
      throw new DatabaseError({
        code: ErrorCode.BAD_REQUEST,
        message: "User ID is required for deletion",
      });
    }

    try {
      return await this.executeQuery(async (db) => {
        const [verifiedUser] = await db
          .update(schema.userAccounts)
          .set({ isEmailVerified: true, verifiedAt: new Date().toISOString() })
          .where(eq(schema.userAccounts.id, id))
          .returning();
        return verifiedUser || null;
      });
    } catch (error) {
      throw new DatabaseError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: `Failed to verify user email: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Searches for user accounts based on a query string.
   * @param query The search query.
   * @param limit The maximum number of results to return.
   * @param offset The number of results to skip.
   * @returns An array of user accounts matching the search criteria.
   */
  async searchUserAccounts(
    query: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<UserAccount[]> {
    return this.executeQuery(async (db) => {
      return db
        .select()
        .from(schema.userAccounts)
        .where(
          or(
            like(schema.userAccounts.username, `%${query}%`),
            like(schema.userAccounts.email, `%${query}%`),
            like(schema.userAccounts.firstname, `%${query}%`),
            like(schema.userAccounts.lastname, `%${query}%`),
          ),
        )
        .limit(limit)
        .offset(offset);
    });
  }

  /**
   * Retrieves recently created user accounts.
   * @param limit The maximum number of results to return.
   * @returns An array of recently created user accounts.
   */
  async getRecentlyCreatedAccounts(limit: number = 10): Promise<UserAccount[]> {
    return this.executeQuery(async (db) => {
      return db
        .select()
        .from(schema.userAccounts)
        .orderBy(desc(schema.userAccounts.createdAt))
        .limit(limit);
    });
  }

  /**
   * Updates the profile image URL for a user account.
   * @param id The ID of the user account to update.
   * @param imageUrl The new profile image URL.
   * @returns The updated user account.
   * @throws {DatabaseError} If the update fails.
   */
  async updateProfileImage(id: number, imageUrl: string): Promise<UserAccount> {
    try {
      const [updatedUser] = await this.getClient()
        .update(schema.userAccounts)
        .set({ profileImageUrl: imageUrl })
        .where(eq(schema.userAccounts.id, id))
        .returning();
      if (!updatedUser) {
        throw new DatabaseError({
          code: "NOT_FOUND",
          message: `User account with ID ${id} not found`,
        });
      }
      return updatedUser;
    } catch (error) {
      throw new DatabaseError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update profile image: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Retrieves a user account with all its related data including teams, address, API keys, roles, and settings.
   *
   * @param userId The ID of the user account to retrieve.
   * @returns A Promise resolving to an object containing the user account and all its related data.
   * @throws {DatabaseError} If the user is not found or if there's an error during the database query.
   */
  async getUserWithAllRelations(userId: number): Promise<{
    user: UserAccount;
    teams: Array<{ id: number; name: string }>;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    } | null;
    apiKeys: Array<{ id: number; key: string; name: string }>;
    roles: Array<{ id: number; name: string }>;
  }> {
    try {
      const result = await this.getClient().transaction(async (tx) => {
        // Fetch the user
        const [user] = await tx
          .select()
          .from(schema.userAccounts)
          .where(eq(schema.userAccounts.id, userId));

        if (!user) {
          throw new DatabaseError({
            code: "NOT_FOUND",
            message: `User with ID ${userId} not found`,
          });
        }

        // Fetch teams
        const userTeams = await tx
          .select({
            id: schema.teams.id,
            name: schema.teams.name,
          })
          .from(schema.teamMembers)
          .innerJoin(
            schema.teams,
            eq(schema.teamMembers.teamId, schema.teams.id),
          )
          .where(eq(schema.teamMembers.userAccountId, userId));

        // Fetch address
        const [userAddress] = await tx
          .select({
            street: schema.addresses.address,
            city: schema.addresses.city,
            state: schema.addresses.state,
            zipcode: schema.addresses.zipcode,
            unit: schema.addresses.unit,
          })
          .from(schema.addresses)
          .where(eq(schema.addresses.userAccountId, userId));

        // Fetch API keys
        const userApiKeys = await tx
          .select({
            id: schema.apiKeys.id,
            key: schema.apiKeys.key,
            name: schema.apiKeys.name,
          })
          .from(schema.apiKeys)
          .where(eq(schema.apiKeys.userAccountId, userId));

        // Fetch roles
        const userRoles = await tx
          .select({
            id: schema.roles.id,
            name: schema.roles.name,
          })
          .from(schema.roles)
          .where(eq(schema.roles.userAccountId, userId));

        return {
          user,
          teams: userTeams,
          address: userAddress || null,
          apiKeys: userApiKeys,
          roles: userRoles,
        };
      });

      return {
        user: result.user,
        teams: result.teams,
        address: result.address
          ? {
              street: result.address.street || "",
              city: result.address.city || "",
              state: result.address.state || "",
              country: "", // Add a default empty string for country
              postalCode: result.address.zipcode || "", // Use zipcode as postalCode
            }
          : null,
        apiKeys: result.apiKeys,
        roles: result.roles,
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to retrieve user data: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }
}
