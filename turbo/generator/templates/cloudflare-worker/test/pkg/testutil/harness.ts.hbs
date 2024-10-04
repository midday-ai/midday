import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { TaskContext } from "vitest";
import { DrizzleDatabase } from "../../../src/pkg/database/db";
import * as schema from "../../../src/pkg/database/schema";
import { UserAccount } from "../../../src/pkg/database/schema";

export type Resources = {
  user: UserAccount;
};

export abstract class Harness {
  public readonly db: DrizzleDatabase;
  public resources: Resources;
  public testUser: UserAccount | null = null;

  constructor(t: TaskContext, d1: D1Database) {
    const db = drizzle(d1, { schema });

    this.db = db as DrizzleDatabase;

    // create a test user for this suite of tests
    this.createTestUser();

    // // definne the resources for this suite of tests
    this.resources = this.createResources();

    t.onTestFinished(async () => {
      await this.teardown();
    });
  }

  private async createTestUser(): Promise<void> {
    const [user] = await this.db
      .insert(schema.userAccounts)
      .values({
        email: "test@example.com",
        username: "testuser",
      })
      .returning()
      .execute();

    this.testUser = user;
  }

  private async teardown(): Promise<void> {
    const deleteUser = async () => {
      if (!this.testUser) {
        return;
      }

      await this.db
        .delete(schema.userAccounts)
        .where(eq(schema.userAccounts.id, this.testUser.id));
    };

    for (let i = 1; i <= 5; i++) {
      try {
        await deleteUser();
        return;
      } catch (err) {
        if (i === 5) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, i * 500));
      }
    }
  }

  // private async optimisticUpsertPermission(workspaceId: string, name: string): Promise<Permission> {
  //   const permission: Permission = {
  //     id: newId("test"),
  //     name,
  //     workspaceId,
  //     createdAt: new Date(),
  //     updatedAt: null,
  //     description: null,
  //   };

  //   return this.db.primary.transaction(async (tx) => {
  //     const found = await tx.query.permissions.findFirst({
  //       where: (table, { and, eq }) =>
  //         and(eq(table.workspaceId, workspaceId), eq(table.name, name)),
  //     });
  //     if (found) {
  //       return found;
  //     }

  //     await tx.insert(schema.permissions).values(permission);

  //     return permission;
  //   });
  // }

  // private async optimisticUpsertRole(workspaceId: string, name: string): Promise<Role> {
  //   const role: Role = {
  //     id: newId("test"),
  //     name,
  //     workspaceId,
  //     createdAt: new Date(),
  //     updatedAt: null,
  //     description: null,
  //   };
  //   return this.db.primary.transaction(async (tx) => {
  //     const found = await tx.query.roles.findFirst({
  //       where: (table, { and, eq }) =>
  //         and(eq(table.workspaceId, workspaceId), eq(table.name, name)),
  //     });
  //     if (found) {
  //       return found;
  //     }

  //     await tx.insert(schema.roles).values(role);

  //     return role;
  //   });
  // }

  public createResources(): Resources {
    return {
      user: this.testUser!,
    };
  }
}
