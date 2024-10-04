import { Bindings } from "../bindings";
import { DatabaseClient } from "./db";
import { UserAccountDatabaseClient } from "./user-account-client";

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private userAccountDbClient: UserAccountDatabaseClient | null = null;

  private constructor() {}

  public static async getInstance(db: D1Database): Promise<DatabaseManager> {
    if (!DatabaseManager.instance) {
      const client = await UserAccountDatabaseClient.getInstance(db);
      DatabaseManager.instance = new DatabaseManager();
      DatabaseManager.instance.userAccountDbClient = client;
    }

    return DatabaseManager.instance;
  }
}
