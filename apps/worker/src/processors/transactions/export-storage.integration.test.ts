import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Database } from "@midday/db/client";
import type { Job } from "bullmq";
import type { ExportTransactionsPayload } from "../../schemas/transactions";

const connectionString = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER === "local" &&
  Boolean(connectionString && process.env.STORAGE_ENDPOINT);

describe.skipIf(!enabled)(
  "Export storage and document mirror integration",
  () => {
    let db: Database;
    let teamId: string;
    let key: string;
    beforeAll(async () => {
      const databaseHost = new URL(connectionString!).hostname;
      const storageHost = new URL(process.env.STORAGE_ENDPOINT!).hostname;
      if (
        ![databaseHost, storageHost].every((host) =>
          ["localhost", "127.0.0.1", "[::1]"].includes(host),
        )
      ) {
        throw new Error(
          "Storage integration requires local database and storage endpoints",
        );
      }
      process.env.DATABASE_PRIMARY_URL = connectionString;
      process.env.DATABASE_PRIMARY_POOLER_URL = connectionString;
      process.env.DATABASE_SSL = "disable";
      const client = await import("@midday/db/client");
      db = client.db;
      const { teams } = await import("@midday/db/schema");
      const [team] = await db
        .insert(teams)
        .values({ name: "Storage export integration" })
        .returning({ id: teams.id });
      teamId = team!.id;
    });
    afterAll(async () => {
      if (key) {
        const { remove } = await import("@midday/storage");
        await remove("vault", [key]);
      }
      if (teamId) {
        const { eq } = await import("drizzle-orm");
        const { teams } = await import("@midday/db/schema");
        await db.delete(teams).where(eq(teams.id, teamId));
      }
      const { closeWorkerDb } = await import("@midday/db/worker-client");
      const { closeDb } = await import("@midday/db/client");
      await closeWorkerDb();
      await closeDb();
    });
    test("real export processor creates a ZIP and updates its synchronous document row", async () => {
      const { ExportTransactionsProcessor } = await import("./export");
      const { download, head } = await import("@midday/storage");
      const { getDocumentById } = await import("@midday/db/queries");
      const job = {
        id: "local-storage-export",
        data: {
          teamId,
          userId: crypto.randomUUID(),
          locale: "en",
          transactionIds: [],
          exportSettings: {
            includeCSV: true,
            includeXLSX: false,
            sendEmail: false,
          },
        },
        updateProgress: async () => {},
      } as unknown as Job<ExportTransactionsPayload>;
      const result = await new ExportTransactionsProcessor().process(job);
      key = result.fullPath;
      expect(key).toStartWith(`${teamId}/exports/`);
      const info = await head("vault", key);
      expect(info?.contentType).toBe("application/zip");
      expect(info!.size).toBeGreaterThan(0);
      const blob = await download("vault", key);
      expect(new Uint8Array(await blob!.arrayBuffer()).slice(0, 2)).toEqual(
        new Uint8Array([80, 75]),
      );
      const document = await getDocumentById(db, { teamId, filePath: key });
      expect(document).toMatchObject({
        name: key,
        pathTokens: key.split("/"),
        parentId: "exports",
        processingStatus: "completed",
        metadata: {
          mimetype: "application/zip",
          contentType: "application/zip",
          size: info!.size,
        },
      });
    });
  },
);
