import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "../client";
import { createShortLink, getShortLinkByShortId } from "../queries/short-links";

const url = process.env.TEST_DATABASE_URL;
const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
describe.skipIf(!url)("short-link existing-schema compatibility", () => {
  let pool: Pool;
  let db: Database;
  const teamId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  beforeAll(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url!).hostname))
      throw new Error("Local test database required");
    pool = new Pool({ connectionString: url, max: 1, ssl: false });
    // TEMP tables shadow public tables on this dedicated connection; no application data changes.
    await pool.query(`CREATE TEMP TABLE teams(id uuid PRIMARY KEY, name text);
      CREATE TEMP TABLE short_links(id uuid DEFAULT gen_random_uuid() PRIMARY KEY, short_id text NOT NULL, url text NOT NULL, team_id uuid NOT NULL, user_id uuid NOT NULL, type text, file_name text, mime_type text, size numeric(10,2), expires_at timestamptz, created_at timestamptz DEFAULT now() NOT NULL)`);
    await pool.query(
      "INSERT INTO teams(id,name) VALUES ($1,'Compatibility test')",
      [teamId],
    );
    db = drizzle(pool) as unknown as Database;
  });
  afterAll(async () => {
    await pool?.end();
    if (originalProvider === undefined)
      delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
  });
  test("default Supabase inserts and selects against unchanged schema without local columns", async () => {
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    const link = await createShortLink(db, {
      url: "https://storage.example.test/signed",
      teamId,
      userId,
      type: "download",
      size: 123,
    });
    expect(link).toMatchObject({
      url: "https://storage.example.test/signed",
      bucket: null,
      objectKey: null,
      size: 123,
    });
    const selected = await getShortLinkByShortId(db, link!.shortId);
    expect(selected).toMatchObject({
      teamId,
      userId,
      bucket: null,
      objectKey: null,
    });
  });
  test("explicit local backend writes and reads object references after additive migration", async () => {
    await pool.query(
      "ALTER TABLE pg_temp.short_links ADD COLUMN bucket text, ADD COLUMN object_key text",
    );
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    const link = await createShortLink(db, {
      url: `storage://vault/${teamId}/a.pdf`,
      bucket: "vault",
      objectKey: `${teamId}/a.pdf`,
      teamId,
      userId,
      type: "download",
    });
    expect(link).toMatchObject({
      bucket: "vault",
      objectKey: `${teamId}/a.pdf`,
    });
    expect(await getShortLinkByShortId(db, link!.shortId)).toMatchObject({
      bucket: "vault",
      objectKey: `${teamId}/a.pdf`,
    });
  });
});
