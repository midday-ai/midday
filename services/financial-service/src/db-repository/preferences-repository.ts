import { eq } from "drizzle-orm";
import { DrizzleDB } from "../db/client";
import {
  createDefaultPreferences,
  isValidServiceTier,
  isValidWebhookEvent,
  preferences,
  WebhookEventType,
  type NewPreferences,
  type Preferences,
  type ServiceTier,
} from "../db/schema/preferences";
import { users } from "../db/schema/users";

/**
 * Repository class for managing user preferences in the database.
 */
export class PreferencesRepository {
  private db: DrizzleDB;

  /**
   * Creates a new PreferencesRepository instance.
   * @param d1 - The D1 database instance to use for database operations.
   */
  constructor(d1: DrizzleDB) {
    this.db = d1;
  }

  private validatePreferences(
    prefs: Partial<Preferences>,
    currentPrefs?: Preferences,
  ) {
    // Get current tier context
    const currentTier = currentPrefs?.serviceTier || prefs.serviceTier;

    // Validate service tier
    if (prefs.serviceTier && !isValidServiceTier(prefs.serviceTier)) {
      throw new Error(`Invalid service tier: ${prefs.serviceTier}`);
    }

    // Validate rate limits
    if (
      prefs.maxRequestsPerSecond !== undefined &&
      prefs.maxRequestsPerSecond !== null
    ) {
      if (prefs.maxRequestsPerSecond < 0) {
        throw new Error(
          "Invalid rate limit: maxRequestsPerSecond cannot be negative",
        );
      }

      const tier = prefs.serviceTier || currentTier;
      if (tier === "starter" && prefs.maxRequestsPerSecond > 100) {
        throw new Error("Rate limit exceeds tier maximum for starter tier");
      }
    }

    // Validate webhook URL
    if (prefs.webhookUrl && !prefs.webhookUrl.startsWith("http")) {
      throw new Error("Invalid webhook URL: must be a valid HTTP(S) URL");
    }

    // Validate webhook events
    if (prefs.webhookEvents) {
      if (!Array.isArray(prefs.webhookEvents)) {
        throw new Error("Invalid webhook event type");
      }

      if (!prefs.webhookEvents.every(isValidWebhookEvent)) {
        throw new Error("Invalid webhook event type");
      }
    }

    // Validate compliance level for enterprise tier
    if (
      (prefs.serviceTier === "enterprise" || currentTier === "enterprise") &&
      prefs.complianceLevel === "basic"
    ) {
      throw new Error("Invalid compliance level for enterprise tier");
    }
  }

  private prepareForDatabase(
    prefs: Partial<Preferences>,
  ): Partial<Preferences> {
    const prepared = { ...prefs };

    // Properly serialize JSON fields
    if (prepared.webhookEvents !== undefined) {
      prepared.webhookEvents =
        prepared.webhookEvents === null
          ? null
          : (prepared.webhookEvents as WebhookEventType[]);
    }
    if (prepared.ipWhitelist !== undefined) {
      prepared.ipWhitelist =
        prepared.ipWhitelist === null ? null : prepared.ipWhitelist;
    }

    return prepared;
  }

  /**
   * Creates new preferences for a user.
   * @param preferences - The preferences data to be inserted.
   * @returns A Promise that resolves to the created Preferences object.
   */
  async create(prefs: NewPreferences): Promise<Preferences> {
    // Validate preferences
    this.validatePreferences(prefs);

    // Check if user exists
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, prefs.userId));

    if (!user) {
      throw new Error(`User with ID ${prefs.userId} not found`);
    }

    // Check for existing preferences
    const existing = await this.getByUserId(prefs.userId);
    if (existing) {
      throw new Error(`Preferences already exist for user ${prefs.userId}`);
    }

    // Prepare data for database
    const preparedData = this.prepareForDatabase(prefs);
    const [createdPreferences] = await this.db
      .insert(preferences)
      .values({
        ...preparedData,
        userId: prefs.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.mapToPreferences(createdPreferences);
  }

  /**
   * Creates or updates preferences for a user.
   * @param userId - The ID of the user.
   * @param serviceTier - Optional service tier to set.
   * @returns A Promise that resolves to the created or updated Preferences object.
   */
  async createOrUpdate(
    userId: number,
    serviceTier?: ServiceTier,
  ): Promise<Preferences> {
    const existing = await this.getByUserId(userId);

    if (existing) {
      return this.update(existing.id, {
        ...createDefaultPreferences(serviceTier || existing.serviceTier),
        userId,
      });
    }

    return this.create({
      ...createDefaultPreferences(serviceTier || "starter"),
      userId,
    });
  }

  /**
   * Retrieves preferences by their ID.
   * @param id - The ID of the preferences to retrieve.
   * @returns A Promise that resolves to the Preferences object if found, or null if not found.
   */
  async getById(id: number): Promise<Preferences | null> {
    const [prefs] = await this.db
      .select()
      .from(preferences)
      .where(eq(preferences.id, id));
    return prefs ? this.mapToPreferences(prefs) : null;
  }

  /**
   * Retrieves preferences by user ID.
   * @param userId - The ID of the user whose preferences to retrieve.
   * @returns A Promise that resolves to the Preferences object if found, or null if not found.
   */
  async getByUserId(userId: number): Promise<Preferences | null> {
    const [prefs] = await this.db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId));
    return prefs ? this.mapToPreferences(prefs) : null;
  }

  /**
   * Updates existing preferences.
   * @param id - The ID of the preferences to update.
   * @param prefs - An object containing the preferences properties to update.
   * @returns A Promise that resolves to the updated Preferences object if found, or null if not found.
   */
  async update(id: number, prefs: Partial<Preferences>): Promise<Preferences> {
    // Get current preferences for validation context
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Preferences with ID ${id} not found`);
    }

    // Validate preferences with current context
    this.validatePreferences(prefs, current);

    // Prepare data for database
    const preparedData = this.prepareForDatabase(prefs);

    const [updatedPreferences] = await this.db
      .update(preferences)
      .set({
        ...preparedData,
        updatedAt: new Date(),
      })
      .where(eq(preferences.id, id))
      .returning();

    return this.mapToPreferences(updatedPreferences);
  }

  /**
   * Updates preferences by user ID.
   * @param userId - The ID of the user whose preferences to update.
   * @param prefs - An object containing the preferences properties to update.
   * @returns A Promise that resolves to the updated Preferences object.
   */
  async updateByUserId(
    userId: number,
    prefs: Partial<Preferences>,
  ): Promise<Preferences> {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new Error(`No preferences found for user ${userId}`);
    }

    return this.update(existing.id, prefs);
  }

  /**
   * Upgrades a user's service tier and updates related preferences.
   * @param userId - The ID of the user to upgrade.
   * @param newTier - The new service tier.
   * @returns A Promise that resolves to the updated Preferences object.
   */
  async upgradeServiceTier(
    userId: number,
    newTier: ServiceTier,
  ): Promise<Preferences> {
    if (!isValidServiceTier(newTier)) {
      throw new Error(`Invalid service tier: ${newTier}`);
    }

    const existing = await this.getByUserId(userId);
    if (!existing) {
      return this.create({
        ...createDefaultPreferences(newTier),
        userId,
      });
    }

    const defaultPrefs = createDefaultPreferences(newTier);
    return this.update(existing.id, {
      ...defaultPrefs,
      serviceTier: newTier,
      webhookUrl: existing.webhookUrl,
      webhookEvents: existing.webhookEvents,
      ipWhitelist: existing.ipWhitelist,
    });
  }

  /**
   * Deletes preferences from the database.
   * @param id - The ID of the preferences to delete.
   * @returns A Promise that resolves to true if the preferences were deleted, or false if not found.
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(preferences)
      .where(eq(preferences.id, id))
      .returning();
    return result.length > 0;
  }

  /**
   * Deletes preferences by user ID.
   * @param userId - The ID of the user whose preferences to delete.
   * @returns A Promise that resolves to true if the preferences were deleted, or false if not found.
   */
  async deleteByUserId(userId: number): Promise<boolean> {
    const result = await this.db
      .delete(preferences)
      .where(eq(preferences.userId, userId))
      .returning();
    return result.length > 0;
  }

  /**
   * Gets all users with a specific service tier.
   * @param tier - The service tier to filter by.
   * @returns A Promise that resolves to an array of user IDs.
   */
  async getUsersByServiceTier(tier: ServiceTier): Promise<number[]> {
    const results = await this.db
      .select({ userId: preferences.userId })
      .from(preferences)
      .where(eq(preferences.serviceTier, tier));
    return results.map((r) => r.userId);
  }

  /**
   * Maps a database row to a Preferences object.
   * @param row - The database row containing preferences data.
   * @returns A Preferences object with properties mapped from the database row.
   */
  private mapToPreferences(row: unknown): Preferences {
    const mapped = row as Record<string, unknown>;
    const preferences: Partial<Preferences> = {};

    // Parse JSON fields
    if (typeof mapped.webhookEvents === "string") {
      try {
        mapped.webhookEvents = JSON.parse(mapped.webhookEvents);
      } catch {
        mapped.webhookEvents = null;
      }
    }

    if (typeof mapped.ipWhitelist === "string") {
      try {
        mapped.ipWhitelist = JSON.parse(mapped.ipWhitelist);
      } catch {
        mapped.ipWhitelist = null;
      }
    }

    // Map all properties from the database row to the Preferences object
    for (const [key, value] of Object.entries(mapped)) {
      if (Object.prototype.hasOwnProperty.call(mapped, key)) {
        preferences[key as keyof Preferences] = value as any;
      }
    }

    // Ensure all required properties are present
    if (!this.isValidPreferences(preferences)) {
      throw new Error("Invalid preferences data from database");
    }

    return preferences as Preferences;
  }

  private isValidPreferences(
    preferences: Partial<Preferences>,
  ): preferences is Preferences {
    const requiredKeys: (keyof Preferences)[] = [
      "id",
      "createdAt",
      "updatedAt",
      "userId",
      "serviceTier",
      "complianceLevel",
    ];
    return requiredKeys.every((key) => key in preferences);
  }
}
