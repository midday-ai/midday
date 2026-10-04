import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  getBankConnectionById,
  getBankConnectionCount,
  updateBankConnectionExpiry,
  updateBankConnectionReferenceId,
} from "../queries/bank-connection-jobs";
import { updateBankConnectionStatus } from "../queries/bank-connections";
import {
  getBankAccountsByConnectionId,
  getBankAccountsForSync,
  updateBankAccountMatch,
  updateBankAccountSyncState,
} from "../queries/bank-sync";
import { markInvoiceViewed } from "../queries/invoice-jobs";
import {
  createTransactionAttachment,
  findUnfulfilledTransactionsForInvoice,
  markTransactionsNotified,
} from "../queries/transaction-jobs";
import { upsertTransactions as upsertTransactionsForTeam } from "../queries/transactions";
import * as schema from "../schema";
import { closeDatabase, getTestDatabase } from "./helpers/test-database";

describe.skipIf(!process.env.TEST_DATABASE_URL)("P08 migrated database", () => {
  const db = getTestDatabase();
  const teamA = randomUUID();
  const teamB = randomUUID();
  const userId = randomUUID();
  const connectionA = randomUUID();
  const connectionB = randomUUID();
  const savedEncryptionKey = process.env.MIDDAY_ENCRYPTION_KEY;

  async function account(
    overrides: Partial<typeof schema.bankAccounts.$inferInsert> = {},
  ) {
    const [row] = await db
      .insert(schema.bankAccounts)
      .values({
        teamId: teamA,
        createdBy: userId,
        bankConnectionId: connectionA,
        accountId: randomUUID(),
        currency: "EUR",
        name: "Checking",
        type: "depository",
        ...overrides,
      })
      .returning();
    return row!;
  }

  async function transaction(
    overrides: Partial<typeof schema.transactions.$inferInsert> = {},
  ) {
    const [row] = await db
      .insert(schema.transactions)
      .values({
        teamId: teamA,
        internalId: randomUUID(),
        name: "Invoice payment",
        date: "2026-10-03",
        method: "transfer",
        amount: 50,
        currency: "EUR",
        ...overrides,
      })
      .returning();
    return row!;
  }

  beforeAll(async () => {
    process.env.MIDDAY_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    await db.insert(schema.teams).values([
      { id: teamA, name: "Jobs A" },
      { id: teamB, name: "Jobs B" },
    ]);
    await db.insert(schema.authUsers).values({
      id: userId,
      email: `${userId}@example.test`,
      name: "Jobs Test",
    });
    await db.insert(schema.users).values({
      id: userId,
      email: `${userId}@example.test`,
      fullName: "Jobs Test",
    });
    await db.insert(schema.bankConnections).values([
      {
        id: connectionA,
        teamId: teamA,
        institutionId: "jobs-a",
        name: "A",
        provider: "gocardless",
      },
      {
        id: connectionB,
        teamId: teamB,
        institutionId: "jobs-b",
        name: "B",
        provider: "gocardless",
      },
    ]);
  });

  afterAll(async () => {
    await db
      .delete(schema.teams)
      .where(inArray(schema.teams.id, [teamA, teamB]));
    await db.delete(schema.users).where(eq(schema.users.id, userId));
    await db.delete(schema.authUsers).where(eq(schema.authUsers.id, userId));
    await closeDatabase();
    if (savedEncryptionKey === undefined)
      delete process.env.MIDDAY_ENCRYPTION_KEY;
    else process.env.MIDDAY_ENCRYPTION_KEY = savedEncryptionKey;
  });

  describe("Phase 08 real database isolation", () => {
    test("notifies only unnotified team rows and returns descending dates once", async () => {
      const oldest = await transaction({ date: "2026-10-01" });
      const newest = await transaction({ date: "2026-10-04" });
      const notified = await transaction({ notified: true });
      const foreign = await transaction({ teamId: teamB });
      const nullFlag = await transaction({ notified: null });
      const rows = await markTransactionsNotified(db, { teamId: teamA });
      expect(rows.map((r) => r.id)).toEqual([newest.id, oldest.id]);
      expect(
        rows.some((r) => [notified.id, foreign.id, nullFlag.id].includes(r.id)),
      ).toBe(false);
      expect(await markTransactionsNotified(db, { teamId: teamA })).toEqual([]);
      const [foreignRow] = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, foreign.id));
      expect(foreignRow?.notified).toBe(false);
    });

    test("fulfillment excludes completed/attached rows and foreign team attachments do not fulfill", async () => {
      const amount = 1234.56;
      const eligible = await transaction({ amount });
      const foreignAttachment = await transaction({ amount });
      const attached = await transaction({ amount });
      await transaction({ amount, status: "completed" });
      await transaction({ amount, teamId: teamB });
      await transaction({ amount, date: "2026-09-29" });
      await transaction({ amount, currency: "USD" });
      await transaction({ amount: 1234.57 });
      await db.insert(schema.transactionAttachments).values([
        { teamId: teamA, transactionId: attached.id },
        { teamId: teamB, transactionId: foreignAttachment.id },
      ]);
      const result = await findUnfulfilledTransactionsForInvoice(db, {
        teamId: teamA,
        amount,
        currency: "eur",
        since: "2026-10-01T12:00:00.000Z",
      });
      expect(result.map((r) => r.id).sort()).toEqual(
        [eligible.id, foreignAttachment.id].sort(),
      );
    });

    test("upsert forces verified teamId and keeps duplicate behavior", async () => {
      const row = {
        name: "Bank transaction",
        date: "2026-10-01",
        currency: "EUR",
        amount: 1,
        method: "transfer" as const,
        internalId: randomUUID(),
        teamId: teamB,
      };
      const result = await upsertTransactionsForTeam(db, {
        teamId: teamA,
        transactions: [row],
      });
      const [stored] = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, result[0]!.id));
      expect(stored?.teamId).toBe(teamA);
      expect(stored?.manual).toBe(false);
      expect(
        await upsertTransactionsForTeam(db, {
          teamId: teamA,
          transactions: [row],
        }),
      ).toEqual([]);
    });

    test("upsert cannot link a foreign bank account to the verified team", async () => {
      const foreign = await account({
        teamId: teamB,
        bankConnectionId: connectionB,
      });
      const internalId = randomUUID();
      await expect(
        upsertTransactionsForTeam(db, {
          teamId: teamA,
          transactions: [
            {
              teamId: teamA,
              internalId,
              bankAccountId: foreign.id,
              name: "Injected account",
              date: "2026-10-01",
              currency: "EUR",
              amount: 1,
              method: "transfer",
            },
          ],
        }),
      ).rejects.toThrow("Bank account not found for team");
      expect(
        await db
          .select({ id: schema.transactions.id })
          .from(schema.transactions)
          .where(eq(schema.transactions.internalId, internalId)),
      ).toEqual([]);
    });

    test("IBAN is encrypted on match and decrypted on reconnect with team/connection predicates", async () => {
      const own = await account();
      const foreign = await account({
        teamId: teamB,
        bankConnectionId: connectionB,
      });
      const iban = "DE89370400440532013000";
      const params = {
        id: own.id,
        teamId: teamA,
        connectionId: connectionA,
        accountId: "new-id",
        accountReference: "new-ref",
        iban,
      };
      expect(await updateBankAccountMatch(db, params)).toEqual({ id: own.id });
      const [stored] = await db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, own.id));
      expect(stored?.iban).not.toBe(iban);
      expect(stored?.iban?.length).toBeGreaterThan(30);
      const rows = await getBankAccountsByConnectionId(db, {
        teamId: teamA,
        connectionId: connectionA,
      });
      expect(rows.find((r) => r.id === own.id)?.iban).toBe(iban);
      expect(
        await getBankAccountsByConnectionId(db, {
          teamId: teamA,
          connectionId: connectionB,
        }),
      ).toEqual([]);
      expect(
        await updateBankAccountMatch(db, { ...params, id: foreign.id }),
      ).toBeUndefined();
      expect(
        await updateBankAccountMatch(db, {
          ...params,
          connectionId: connectionB,
        }),
      ).toBeUndefined();
      const [unchanged] = await db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, foreign.id));
      expect(unchanged?.accountId).toBe(foreign.accountId);
      expect(unchanged?.iban).toBeNull();
    });

    test("sync retry filter preserves manual retry recovery and both join team boundaries", async () => {
      const uniqueConnection = randomUUID();
      await db.insert(schema.bankConnections).values({
        id: uniqueConnection,
        teamId: teamA,
        institutionId: uniqueConnection,
        name: "Retry",
        provider: "gocardless",
      });
      const active = await account({
        bankConnectionId: uniqueConnection,
        errorRetries: null,
      });
      const thirdRetry = await account({
        bankConnectionId: uniqueConnection,
        errorRetries: 3,
      });
      const errored = await account({
        bankConnectionId: uniqueConnection,
        errorRetries: 4,
      });
      await account({ bankConnectionId: uniqueConnection, enabled: false });
      await account({ bankConnectionId: uniqueConnection, manual: true });
      await account({ bankConnectionId: uniqueConnection, teamId: teamB });
      const params = { teamId: teamA, connectionId: uniqueConnection };
      expect(
        (await getBankAccountsForSync(db, { ...params, includeErrored: false }))
          .map((r) => r.id)
          .sort(),
      ).toEqual([active.id, thirdRetry.id].sort());
      expect(
        (await getBankAccountsForSync(db, { ...params, includeErrored: true }))
          .map((r) => r.id)
          .sort(),
      ).toEqual([active.id, thirdRetry.id, errored.id].sort());
      expect(
        await getBankAccountsForSync(db, {
          teamId: teamB,
          connectionId: uniqueConnection,
          includeErrored: true,
        }),
      ).toEqual([]);
    });

    test("sync state supports zero/null and rejects another team's account", async () => {
      const own = await account({
        balance: 100,
        errorRetries: 4,
        errorDetails: "disconnected",
      });
      expect(
        await updateBankAccountSyncState(db, {
          id: own.id,
          teamId: teamB,
          balance: -9,
        }),
      ).toBeUndefined();
      await updateBankAccountSyncState(db, {
        id: own.id,
        teamId: teamA,
        balance: 0,
        availableBalance: null,
        creditLimit: null,
        errorRetries: null,
        errorDetails: null,
      });
      const [row] = await db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, own.id));
      expect(row?.balance).toBe(0);
      expect(row?.errorRetries).toBeNull();
      expect(row?.errorDetails).toBeNull();
    });

    test("reconnect updates cannot alter foreign connections", async () => {
      const params = {
        id: connectionB,
        teamId: teamA,
        expiresAt: "2027-01-01T00:00:00.000Z",
        referenceId: "attack",
      };
      expect(await updateBankConnectionExpiry(db, params)).toBeUndefined();
      expect(await updateBankConnectionReferenceId(db, params)).toBeUndefined();
      expect(
        await updateBankConnectionStatus(db, {
          ...params,
          status: "disconnected",
        }),
      ).toBeUndefined();
      expect(
        await getBankConnectionById(db, { id: connectionB, teamId: teamA }),
      ).toBeUndefined();
      const [foreign] = await db
        .select()
        .from(schema.bankConnections)
        .where(eq(schema.bankConnections.id, connectionB));
      expect(foreign?.expiresAt).toBeNull();
      expect(foreign?.referenceId).toBeNull();
      expect(foreign?.status).toBe("connected");
      expect(
        await updateBankConnectionExpiry(db, { ...params, id: connectionA }),
      ).toEqual({ id: connectionA });
      expect(await getBankConnectionCount(db, { teamId: teamB })).toBe(1);
    });

    test("invoice view and attachment writes bind team to row", async () => {
      const [invoice] = await db
        .insert(schema.invoices)
        .values({ teamId: teamB })
        .returning();
      expect(
        await markInvoiceViewed(db, { id: invoice!.id, teamId: teamA }),
      ).toBeUndefined();
      const [unviewed] = await db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.id, invoice!.id));
      expect(unviewed?.viewedAt).toBeNull();
      expect(
        await markInvoiceViewed(db, { id: invoice!.id, teamId: teamB }),
      ).toEqual({ id: invoice!.id });
      const tx = await transaction();
      const attachment = {
        teamId: teamA,
        transactionId: tx.id,
        type: "application/pdf",
        name: "Invoice.pdf",
        size: 10,
        path: [teamA, "invoice", "Invoice.pdf"],
      };
      expect(
        await createTransactionAttachment(db, { ...attachment, teamId: teamB }),
      ).toBeUndefined();
      const created = await createTransactionAttachment(db, attachment);
      expect(created?.path).toEqual(attachment.path);
      expect(created?.transactionId).toBe(tx.id);
      expect(created?.teamId).toBe(teamA);
      expect(
        (
          await db
            .select()
            .from(schema.transactionAttachments)
            .where(
              and(
                eq(schema.transactionAttachments.transactionId, tx.id),
                eq(schema.transactionAttachments.teamId, teamB),
              ),
            )
        ).length,
      ).toBe(0);
    });
  });
});
