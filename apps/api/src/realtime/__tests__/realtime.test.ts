import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as schema from "@midday/db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { Client, Pool } from "pg";
import {
  parseRealtimeEvent,
  type RealtimeEvent,
  SSEParser,
} from "../../../../dashboard/src/lib/realtime-client-core";
import { verifyAccessToken } from "../../utils/auth";
import { resolveRealtimeTeam } from "../authorization";
import { type ChangeEvent, RealtimeListener } from "../listener-core";
import { createRealtimeRouter } from "../stream";

const connectionString = process.env.REALTIME_TEST_DATABASE_URL;
const waitFor = async (condition: () => boolean, timeoutMs = 10_000) => {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline)
      throw new Error("Timed out waiting for realtime");
    await Bun.sleep(10);
  }
};
describe.skipIf(!connectionString)(
  "Postgres NOTIFY to authorized HTTP SSE",
  () => {
    const pool = new Pool({ connectionString, ssl: false });
    const db = drizzle(pool, { schema });
    const teamA = crypto.randomUUID();
    const teamB = crypto.randomUUID();
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    const memberA = crypto.randomUUID();
    const nonmember = crypto.randomUUID();
    const clients: Client[] = [];
    const listener = new RealtimeListener({
      createClient: () => {
        const client = new Client({
          connectionString,
          ssl: false,
          application_name: `phase09-${teamA}`,
        });
        clients.push(client);
        return client;
      },
    });
    let server: ReturnType<typeof Bun.serve>;
    let signToken: (id: string, expiresIn?: number) => Promise<string>;
    const closers: (() => Promise<void>)[] = [];
    const oldEnv = {
      NEXT_PUBLIC_BACKEND_PROVIDER: process.env.NEXT_PUBLIC_BACKEND_PROVIDER,
      AUTH_JWKS_URL: process.env.AUTH_JWKS_URL,
      AUTH_JWT_ISSUER: process.env.AUTH_JWT_ISSUER,
      AUTH_JWT_AUDIENCE: process.env.AUTH_JWT_AUDIENCE,
    };
    beforeAll(async () => {
      if (
        !["localhost", "127.0.0.1", "[::1]"].includes(
          new URL(connectionString!).hostname,
        )
      )
        throw new Error("Local Postgres required");
      process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
      await pool.query(
        "INSERT INTO teams (id,name) VALUES ($1,'Realtime A'),($2,'Realtime B')",
        [teamA, teamB],
      );
      for (const [id, teamId] of [
        [userA, teamA],
        [memberA, teamA],
        [userB, teamB],
        [nonmember, teamA],
      ]) {
        await pool.query("INSERT INTO auth_users (id,email) VALUES ($1,$2)", [
          id,
          `${id}@realtime.test`,
        ]);
        await pool.query("INSERT INTO users (id,team_id) VALUES ($1,$2)", [
          id,
          teamId,
        ]);
        if (id !== nonmember)
          await pool.query(
            "INSERT INTO users_on_team (user_id,team_id,role) VALUES ($1,$2,'owner')",
            [id, teamId],
          );
      }
      const { publicKey, privateKey } = await generateKeyPair("EdDSA", {
        extractable: true,
      });
      const jwk = {
        ...(await exportJWK(publicKey)),
        kid: "realtime-test",
        alg: "EdDSA",
        use: "sig",
      };
      const app = new Hono();
      app.get("/jwks", (c) => c.json({ keys: [jwk] }));
      app.route(
        "/realtime",
        createRealtimeRouter({
          verifyToken: verifyAccessToken,
          resolveTeam: (id) => resolveRealtimeTeam(db, id),
          subscribe: (identity, callback) =>
            listener.subscribe(identity, callback),
        }),
      );
      server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: app.fetch });
      process.env.AUTH_JWKS_URL = `${server.url}jwks`;
      process.env.AUTH_JWT_ISSUER = server.url.toString();
      process.env.AUTH_JWT_AUDIENCE = "midday-realtime-tests";
      signToken = (id, expiresIn = 900) =>
        new SignJWT({ aal: "aal1" })
          .setProtectedHeader({ alg: "EdDSA", kid: "realtime-test" })
          .setSubject(id)
          .setIssuedAt()
          .setIssuer(server.url.toString())
          .setAudience("midday-realtime-tests")
          .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
          .sign(privateKey);
    });
    afterAll(async () => {
      await Promise.all(closers.map((close) => close()));
      await listener.close();
      server?.stop(true);
      await pool.query("DELETE FROM teams WHERE id=ANY($1::uuid[])", [
        [teamA, teamB],
      ]);
      await pool.query("DELETE FROM auth_users WHERE id=ANY($1::uuid[])", [
        [userA, userB, memberA, nonmember],
      ]);
      await pool.end();
      for (const [key, value] of Object.entries(oldEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
    async function connect(id: string) {
      const controller = new AbortController();
      const response = await fetch(
        `${server.url}realtime/stream?teamId=${teamB}`,
        {
          headers: { Authorization: `Bearer ${await signToken(id)}` },
          signal: controller.signal,
        },
      );
      expect(response.status).toBe(200);
      const events: RealtimeEvent[] = [];
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      const parser = new SSEParser((name, data) => {
        const event = name === "change" ? parseRealtimeEvent(data) : null;
        if (event) events.push(event);
      });
      const reading = (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            parser.feed(decoder.decode(value, { stream: true }));
          }
        } catch (error) {
          if (!controller.signal.aborted) throw error;
        }
      })();
      const close = async () => {
        controller.abort();
        await reading;
      };
      closers.push(close);
      await waitFor(() => listener.connected);
      return { events, close };
    }
    test("actual JWKS rejects forged/expired JWT and missing membership", async () => {
      const request = (authorization?: string) =>
        fetch(`${server.url}realtime/stream`, {
          headers: authorization ? { Authorization: authorization } : {},
        });
      expect((await request()).status).toBe(401);
      expect((await request("Bearer forged")).status).toBe(401);
      expect(
        (await request(`Bearer ${await signToken(userA, -10)}`)).status,
      ).toBe(401);
      expect(
        (await request(`Bearer ${await signToken(nonmember)}`)).status,
      ).toBe(403);
    });
    test("team and activity user isolation through real trigger and HTTP stream", async () => {
      const a = await connect(userA);
      const b = await connect(userB);
      const foreignInbox = crypto.randomUUID();
      const ownInbox = crypto.randomUUID();
      await pool.query(
        "INSERT INTO inbox (id,team_id,status) VALUES ($1,$2,'new'),($3,$4,'new')",
        [foreignInbox, teamB, ownInbox, teamA],
      );
      const foreignActivity = crypto.randomUUID();
      const ownActivity = crypto.randomUUID();
      await pool.query(
        "INSERT INTO activities (id,team_id,user_id,type,priority,source,metadata) VALUES ($1,$2,$3,'inbox_new',2,'system','{}'),($4,$2,$5,'inbox_new',2,'system','{}')",
        [foreignActivity, teamA, memberA, ownActivity, userA],
      );
      await waitFor(
        () =>
          a.events.some((e) => e.new.id === ownActivity) &&
          b.events.some((e) => e.new.id === foreignInbox),
      );
      expect(a.events.every((e) => e.team_id === teamA)).toBe(true);
      expect(b.events.every((e) => e.team_id === teamB)).toBe(true);
      expect(a.events.some((e) => e.new.id === foreignActivity)).toBe(false);
      expect(a.events.find((e) => e.new.id === ownActivity)).toMatchObject({
        user_id: userA,
        new: { priority: 2 },
      });
      await a.close();
      await b.close();
    });
    test("inbox transitions and customer/document fields survive delivery", async () => {
      const stream = await connect(userA);
      const id = crypto.randomUUID();
      const customer = crypto.randomUUID();
      const document = crypto.randomUUID();
      await pool.query(
        "INSERT INTO inbox (id,team_id,status) VALUES ($1,$2,'processing')",
        [id, teamA],
      );
      await pool.query("UPDATE inbox SET status='done' WHERE id=$1", [id]);
      await pool.query(
        "INSERT INTO customers (id,team_id,name,email,enrichment_status) VALUES ($1,$2,'Realtime','realtime@test.invalid','completed')",
        [customer, teamA],
      );
      await pool.query(
        "INSERT INTO documents (id,team_id,name,processing_status) VALUES ($1,$2,$3,'completed')",
        [document, teamA, `${teamA}/vault/realtime.pdf`],
      );
      await waitFor(() => stream.events.some((e) => e.new.id === document));
      expect(
        stream.events.find((e) => e.eventType === "UPDATE" && e.new.id === id),
      ).toMatchObject({
        new: { status: "done" },
        old: { status: "processing" },
      });
      expect(
        stream.events.find((e) => e.new.id === customer)?.new.enrichment_status,
      ).toBe("completed");
      expect(
        stream.events.find((e) => e.new.id === document)?.new.processing_status,
      ).toBe("completed");
      await stream.close();
    });
    test("1000-row insert emits exactly one transaction notification after commit", async () => {
      const observer = new Client({ connectionString, ssl: false });
      await observer.connect();
      const notifications: ChangeEvent[] = [];
      observer.on("notification", (message) => {
        const event = JSON.parse(message.payload!);
        if (event.table === "transactions" && event.team_id === teamA)
          notifications.push(event);
      });
      await observer.query("LISTEN midday_realtime");
      const writer = await pool.connect();
      try {
        await writer.query("BEGIN");
        await writer.query(
          "INSERT INTO transactions (team_id,date,name,method,amount,currency,internal_id) SELECT $1,'2026-01-01','Bulk realtime','other',-1,'USD',$2 || n FROM generate_series(1,1000) AS n",
          [teamA, `${crypto.randomUUID()}-`],
        );
        expect(notifications).toHaveLength(0);
        await writer.query("COMMIT");
        await waitFor(() => notifications.length > 0);
        await observer.query("SELECT 1");
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toMatchObject({
          type: "INSERT",
          new: {},
          old: {},
        });
      } finally {
        await writer.query("ROLLBACK");
        writer.release();
        await observer.end();
      }
    });
    test("ordinary recurring and nested category deletion updates still notify", async () => {
      const stream = await connect(userA);
      const category = crypto.randomUUID();
      const id = crypto.randomUUID();
      const result = await pool.query<{ slug: string }>(
        "INSERT INTO transaction_categories (id,team_id,name) VALUES ($1,$2,'Realtime deletion category') RETURNING slug",
        [category, teamA],
      );
      await pool.query(
        "INSERT INTO transactions (id,team_id,date,name,method,amount,currency,internal_id,category_slug) VALUES ($1::uuid,$2,'2026-01-01','Category realtime','other',-1,'USD',$1::text,$3)",
        [id, teamA, result.rows[0]!.slug],
      );
      await waitFor(() =>
        stream.events.some((e) => e.table === "transactions"),
      );
      stream.events.length = 0;
      await pool.query(
        "UPDATE transactions SET recurring=true,frequency='monthly' WHERE id=$1",
        [id],
      );
      await waitFor(() =>
        stream.events.some(
          (e) => e.table === "transactions" && e.eventType === "UPDATE",
        ),
      );
      expect(stream.events).toHaveLength(1);
      stream.events.length = 0;
      await pool.query("DELETE FROM transaction_categories WHERE id=$1", [
        category,
      ]);
      await waitFor(() =>
        stream.events.some(
          (e) => e.table === "transactions" && e.eventType === "UPDATE",
        ),
      );
      expect(stream.events).toHaveLength(1);
      expect(
        (
          await pool.query(
            "SELECT category_slug FROM transactions WHERE id=$1",
            [id],
          )
        ).rows[0].category_slug,
      ).toBeNull();
      await stream.close();
    });
    test("terminated LISTEN backend reconnects within 30s and resumes events", async () => {
      const stream = await connect(userA);
      const count = clients.length;
      const { rows } = await clients
        .at(-1)!
        .query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
      const start = Date.now();
      await pool.query("SELECT pg_terminate_backend($1)", [rows[0]!.pid]);
      await waitFor(() => clients.length > count && listener.connected, 30_000);
      expect(Date.now() - start).toBeLessThan(30_000);
      const id = crypto.randomUUID();
      await pool.query(
        "INSERT INTO inbox (id,team_id,status) VALUES ($1,$2,'new')",
        [id, teamA],
      );
      await waitFor(() => stream.events.some((e) => e.new.id === id));
      await stream.close();
    }, 35_000);
  },
);
