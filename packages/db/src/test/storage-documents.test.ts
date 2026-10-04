import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "../client";
import {
  deleteDocumentsByNames,
  upsertDocumentForObject,
} from "../queries/documents";
import * as schema from "../schema";

const connectionString = process.env.TEST_DATABASE_URL;
describe.skipIf(!connectionString)(
  "Storage document registration and tenant isolation",
  () => {
    const pool = new Pool({ connectionString, ssl: false });
    const db = drizzle(pool, { schema }) as unknown as Database;
    let teamA: string;
    let teamB: string;
    beforeAll(async () => {
      const teams = await db
        .insert(schema.teams)
        .values([{ name: "Storage test A" }, { name: "Storage test B" }])
        .returning({ id: schema.teams.id });
      teamA = teams[0]!.id;
      teamB = teams[1]!.id;
    });
    afterAll(async () => {
      await db.delete(schema.teams).where(eq(schema.teams.id, teamA));
      await db.delete(schema.teams).where(eq(schema.teams.id, teamB));
      await pool.end();
    });
    test("upsert preserves identity/status while refreshing object metadata", async () => {
      const key = `${teamA}/inbox/receipt.heic`;
      const first = await upsertDocumentForObject(db, {
        teamId: teamA,
        key,
        size: 10,
        mimetype: "image/heic",
      });
      await db
        .update(schema.documents)
        .set({ processingStatus: "completed" })
        .where(eq(schema.documents.id, first!.id));
      const second = await upsertDocumentForObject(db, {
        teamId: teamA,
        key,
        size: 25,
        mimetype: "image/jpeg",
      });
      expect(second?.id).toBe(first?.id);
      const rows = await db
        .select()
        .from(schema.documents)
        .where(
          and(
            eq(schema.documents.teamId, teamA),
            eq(schema.documents.name, key),
          ),
        );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        name: key,
        pathTokens: [teamA, "inbox", "receipt.heic"],
        parentId: "inbox",
        processingStatus: "completed",
        metadata: {
          size: 25,
          mimetype: "image/jpeg",
          contentType: "image/jpeg",
        },
      });
    });
    test("rejects foreign team registration and scopes document deletion", async () => {
      const key = `${teamB}/inbox/foreign.pdf`;
      const row = await upsertDocumentForObject(db, {
        teamId: teamB,
        key,
        size: 1,
        mimetype: "application/pdf",
      });
      await expect(
        upsertDocumentForObject(db, {
          teamId: teamA,
          key,
          size: 1,
          mimetype: "application/pdf",
        }),
      ).rejects.toThrow();
      expect(
        await deleteDocumentsByNames(db, { teamId: teamA, names: [key] }),
      ).toEqual([]);
      expect(
        await db
          .select()
          .from(schema.documents)
          .where(eq(schema.documents.id, row!.id)),
      ).toHaveLength(1);
      expect(
        await deleteDocumentsByNames(db, { teamId: teamB, names: [key] }),
      ).toHaveLength(1);
    });
  },
);
