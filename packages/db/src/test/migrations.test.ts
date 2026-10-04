import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Client } from "pg";

const connectionString = process.env.TEST_DATABASE_URL;

describe.skipIf(!connectionString)("Migrated database", () => {
  let client: Client;
  let teamId: string;

  beforeAll(async () => {
    client = new Client({ connectionString });
    await client.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO teams (name) VALUES ('Migration test') RETURNING id, inbox_id",
    );
    teamId = rows[0].id;
  });

  afterAll(async () => {
    await client.query("ROLLBACK");
    await client.end();
  });

  test("team inbox IDs are generated", async () => {
    const { rows } = await client.query(
      "SELECT inbox_id FROM teams WHERE id = $1",
      [teamId],
    );
    expect(rows[0].inbox_id).toMatch(/^[a-z0-9]{10}$/);
  });

  test("invite codes are generated", async () => {
    const { rows } = await client.query(
      "INSERT INTO user_invites (team_id, email) VALUES ($1, 'migration@example.test') RETURNING code",
      [teamId],
    );
    expect(rows[0].code).toHaveLength(24);
    expect(rows[0].code).not.toBe("nanoid(24)");
  });

  test("unprocessed documents accept null title and body", async () => {
    const { rows } = await client.query(
      "INSERT INTO documents (name, team_id, path_tokens) VALUES ('receipt.pdf', $1, $2) RETURNING title, body",
      [teamId, [teamId, "receipt.pdf"]],
    );
    expect(rows[0]).toEqual({ title: null, body: null });
  });

  test("inbox generated search includes product names", async () => {
    const { rows } = await client.query(
      "INSERT INTO inbox (team_id, display_name, meta) VALUES ($1, 'Acme', $2) RETURNING fts @@ to_tsquery('english', 'widget') AS matches",
      [teamId, JSON.stringify({ products: ["Widget"] })],
    );
    expect(rows[0].matches).toBe(true);
  });

  test("public schema has no row policies or phantom auth table", async () => {
    const { rows } = await client.query(
      `SELECT (SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public') AS policies,
        to_regclass('public."auth.users"') AS phantom_table`,
    );
    expect(rows[0]).toEqual({ policies: 0, phantom_table: null });
  });
});
