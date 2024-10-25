import { DatabaseClient } from "@/db";
import { APIKeyRepository } from "@/db-repository/api-key-repository";
import { UserRepository } from "@/db-repository/user-repository";
import { APIKey } from "@/db/schema/api-keys";
import { User } from "@/db/schema/users";
import { APIKeyGenerator } from "./utils/api-key-generator";

/**
 * Represents the test context containing a created user and various API keys.
 */
export interface TestContext {
  /**
   * The user created for the test context.
   */
  user: User;

  /**
   * A collection of API keys in different states.
   */
  apiKeys: {
    /**
     * The newly created API key.
     */
    created: APIKey | null;

    /**
     * An active API key with assigned scopes.
     */
    active: APIKey | null;

    /**
     * An expired API key.
     */
    expired: APIKey | null;

    /**
     * A revoked API key.
     */
    revoked: APIKey | null;

    /**
     * An API key simulating high usage.
     */
    highUsage: APIKey | null;
  };
}

/**
 * Sets up a test context by creating a user and generating various API keys.
 *
 * @param db - The database client used to interact with the database.
 * @returns A promise that resolves to the initialized test context containing the created user and API keys.
 *
 * @example
 * ```ts
 * const db = new DatabaseClient();
 * const testContext = await setupTestContext(db);
 * console.log(testContext.user); // Access the created user
 * console.log(testContext.apiKeys.active); // Access the active API key
 * ```
 */
export async function setupTestContext(
  db: DatabaseClient,
): Promise<TestContext> {
  const userRepository = new UserRepository(db.getDb());
  const apiKeyRepository = new APIKeyRepository(db.getDb());

  // Create test user
  const user = await userRepository.create({
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    passwordHash: "",
  });

  try {
    // Create API keys with the correct user ID
    const [created, active, expired, revoked, highUsage] = await Promise.all([
      apiKeyRepository.create(APIKeyGenerator.generate({ userId: user.id })),
      apiKeyRepository.create(
        APIKeyGenerator.generate({
          userId: user.id,
          isActive: true,
          scope: ["read", "write"],
        }),
      ),
      apiKeyRepository.create(
        APIKeyGenerator.generateExpired({ userId: user.id }),
      ),
      apiKeyRepository.create(
        APIKeyGenerator.generateRevoked({ userId: user.id }),
      ),
      apiKeyRepository.create(
        APIKeyGenerator.generateHighUsage({ userId: user.id }),
      ),
    ]);

    return {
      user,
      apiKeys: {
        created,
        active,
        expired,
        revoked,
        highUsage,
      },
    };
  } catch (error) {
    // Clean up the user if API key creation fails
    await userRepository.delete(user.id);
    throw error;
  }
}

/**
 * Cleans up the test context by deleting the created user and API keys from the database.
 *
 * @param ctx - The test context to clean up, including the user and API keys.
 * @param db - The database client used to interact with the database.
 * @returns A promise that resolves once the cleanup is complete.
 *
 * @example
 * ```ts
 * const db = new DatabaseClient();
 * const testContext = await setupTestContext(db);
 * await cleanupTestContext(testContext, db);
 * console.log('Test context cleaned up');
 * ```
 *
 * @throws Will throw an error if cleanup fails.
 */
export async function cleanupTestContext(
  ctx: TestContext,
  db: DatabaseClient,
): Promise<void> {
  if (!ctx) return;

  const userRepository = new UserRepository(db.getDb());
  const apiKeyRepository = new APIKeyRepository(db.getDb());

  try {
    // Delete API keys
    if (ctx.apiKeys) {
      for (const key of Object.values(ctx.apiKeys)) {
        if (key?.id) {
          await apiKeyRepository.delete(key.id);
        }
      }
    }

    // Delete user
    if (ctx.user?.id) {
      await userRepository.delete(ctx.user.id);
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
}
