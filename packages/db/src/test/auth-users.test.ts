import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { eq } from "drizzle-orm";
import { createUserProfile, deleteUser } from "../queries/users";
import {
  authAccounts,
  authSessions,
  authUsers,
  teams,
  users,
  usersOnTeam,
} from "../schema";
import {
  cleanDatabase,
  closeDatabase,
  getTestDatabase,
  isTestDatabaseAvailable,
} from "./helpers/test-database";

describe.skipIf(!isTestDatabaseAvailable())(
  "Auth profile and deletion tenant isolation",
  () => {
    const db = getTestDatabase();
    const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    beforeEach(async () => {
      process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
      await cleanDatabase();
    });
    afterEach(() => {
      if (originalProvider === undefined)
        delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
      else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
    });
    afterAll(closeDatabase);
    test("profile creation is idempotent; deletion cascades auth state and preserves shared teams", async () => {
      const userId = crypto.randomUUID();
      const otherId = crypto.randomUUID();
      await db.insert(authUsers).values([
        { id: userId, email: "delete@example.test" },
        { id: otherId, email: "keep@example.test" },
      ]);
      await createUserProfile(db, { id: userId, email: "delete@example.test" });
      await createUserProfile(db, { id: userId, email: "delete@example.test" });
      await createUserProfile(db, {
        id: otherId,
        email: "keep@example.test",
        fullName: "Keep Me",
      });
      const [shared, single] = await db
        .insert(teams)
        .values([{ name: "Shared" }, { name: "Single" }])
        .returning();
      await db.insert(usersOnTeam).values([
        { userId, teamId: shared!.id, role: "owner" },
        { userId: otherId, teamId: shared!.id, role: "member" },
        { userId, teamId: single!.id, role: "owner" },
      ]);
      await db.insert(authSessions).values({
        userId,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 60_000),
      });
      await db
        .insert(authAccounts)
        .values({ userId, providerId: "google", accountId: "local-test" });
      expect(await deleteUser(db, userId)).toEqual({ id: userId });
      expect(
        await db.select().from(authUsers).where(eq(authUsers.id, userId)),
      ).toHaveLength(0);
      expect(
        await db.select().from(users).where(eq(users.id, userId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(authSessions)
          .where(eq(authSessions.userId, userId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(authAccounts)
          .where(eq(authAccounts.userId, userId)),
      ).toHaveLength(0);
      expect(
        await db.select().from(teams).where(eq(teams.id, single!.id)),
      ).toHaveLength(0);
      expect(
        await db.select().from(teams).where(eq(teams.id, shared!.id)),
      ).toHaveLength(1);
      expect(
        await db.select().from(users).where(eq(users.id, otherId)),
      ).toHaveLength(1);
    });
  },
);
