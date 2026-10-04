import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  getBankAccountsBalances,
  getBankAccountsCurrencies,
  updateBankAccount,
} from "../queries/bank-accounts";
import {
  getDocuments,
  getRelatedDocuments,
  updateDocumentByPath,
} from "../queries/documents";
import { createInbox, updateInboxWithProcessedData } from "../queries/inbox";
import { updateInvoice } from "../queries/invoices";
import {
  globalSearchQuery,
  globalSemanticSearchQuery,
} from "../queries/search";
import { getTrackerProjects } from "../queries/tracker-projects";
import {
  createTransactionCategory,
  deleteTransactionCategory,
} from "../queries/transaction-categories";
import { createTransaction, updateTransaction } from "../queries/transactions";
import { inbox, transactions } from "../schema";
import { CATEGORY_NAME, seedParityFixtures } from "./helpers/parity-fixtures";
import {
  cleanDatabase,
  closeDatabase,
  getTestDatabase,
  isTestDatabaseAvailable,
} from "./helpers/test-database";

describe.skipIf(!isTestDatabaseAvailable())(
  "SQL parity and tenant isolation",
  () => {
    let db: Database;
    let fixture: Awaited<ReturnType<typeof seedParityFixtures>>;
    beforeEach(async () => {
      db = getTestDatabase();
      await cleanDatabase();
      fixture = await seedParityFixtures(db);
    });
    afterAll(closeDatabase);

    async function transaction(
      name: string,
      options: {
        teamId?: string;
        currency?: string;
        categorySlug?: string;
        date?: string;
      } = {},
    ) {
      const teamId = options.teamId ?? fixture.teamA;
      const result = await createTransaction(db, {
        name,
        amount: -100,
        currency: "USD",
        date: "2026-01-01",
        ...options,
        teamId,
        bankAccountId:
          teamId === fixture.teamA ? fixture.accountA.id : fixture.accountB.id,
      });
      return result!;
    }

    test("category slug generation and deletion preserve other teams", async () => {
      const a = (await createTransactionCategory(db, {
        teamId: fixture.teamA,
        name: CATEGORY_NAME,
      }))!;
      const b = (await createTransactionCategory(db, {
        teamId: fixture.teamB,
        name: CATEGORY_NAME,
      }))!;
      expect(a.slug).toBe("cafe-resume-x");
      const ta = await transaction("Category A", { categorySlug: a.slug! });
      const tb = await transaction("Category B", {
        teamId: fixture.teamB,
        categorySlug: b.slug!,
      });
      expect(
        await deleteTransactionCategory(db, {
          id: b.id,
          teamId: fixture.teamA,
        }),
      ).toBeUndefined();
      await deleteTransactionCategory(db, { id: a.id, teamId: fixture.teamA });
      const rows = await db.select().from(transactions);
      expect(rows.find((row) => row.id === ta.id)?.categorySlug).toBeNull();
      expect(rows.find((row) => row.id === tb.id)?.categorySlug).toBe(b.slug);
    });

    test("transaction base amounts use the team currency and tolerate a missing rate", async () => {
      const converted = await transaction("Converted");
      const missing = await transaction("No rate", { currency: "JPY" });
      const other = await transaction("Other team", { teamId: fixture.teamB });
      const rows = await db.select().from(transactions);
      expect(rows.find((row) => row.id === converted.id)).toMatchObject({
        baseAmount: -1050,
        baseCurrency: "SEK",
      });
      expect(rows.find((row) => row.id === missing.id)).toMatchObject({
        baseAmount: null,
        baseCurrency: "SEK",
      });
      expect(rows.find((row) => row.id === other.id)).toMatchObject({
        baseAmount: -100,
        baseCurrency: "USD",
      });
    });

    test("bank balances convert on insert and update; read functions isolate enabled balances and distinct currencies", async () => {
      expect(fixture.accountA.baseBalance).toBe(1050);
      const updated = await updateBankAccount(db, {
        id: fixture.accountA.id,
        teamId: fixture.teamA,
        balance: 200,
      });
      expect(updated).toMatchObject({ baseBalance: 2100, baseCurrency: "SEK" });
      expect(
        await updateBankAccount(db, {
          id: fixture.accountB.id,
          teamId: fixture.teamA,
          balance: 1,
        }),
      ).toBeUndefined();
      const balances = await getBankAccountsBalances(db, fixture.teamA);
      expect(balances).toHaveLength(1);
      expect(balances[0]).toMatchObject({
        id: fixture.accountA.id,
        balance: 200,
      });
      expect(typeof balances[0]!.balance).toBe("number");
      expect(await getBankAccountsCurrencies(db, fixture.teamA)).toEqual([
        { currency: "EUR" },
        { currency: "USD" },
      ]);
    });

    test("inbox processing populates base amount and generated search", async () => {
      const item = (await createInbox(db, {
        teamId: fixture.teamA,
        filePath: [fixture.teamA, "inbox.pdf"],
        fileName: "inbox.pdf",
        displayName: "Acme receipt",
        contentType: "application/pdf",
        size: 12,
      }))!;
      await updateInboxWithProcessedData(db, {
        id: item.id,
        amount: 100,
        currency: "USD",
      });
      const [row] = await db
        .select()
        .from(inbox)
        .where(and(eq(inbox.id, item.id), eq(inbox.teamId, fixture.teamA)));
      expect(row).toMatchObject({ baseAmount: 1050, baseCurrency: "SEK" });
      expect(row!.fts).toContain("acm");
    });

    test("learned non-system categorization is isolated by team", async () => {
      const category = (await createTransactionCategory(db, {
        teamId: fixture.teamA,
        name: "Software",
      }))!;
      await createTransactionCategory(db, {
        teamId: fixture.teamB,
        name: "Software",
      });
      const first = await transaction("Spotify AB");
      await updateTransaction(db, {
        id: first.id,
        teamId: fixture.teamA,
        categorySlug: category.slug,
      });
      const learned = await transaction("Spotify AB");
      const other = await transaction("Spotify AB", { teamId: fixture.teamB });
      const rows = await db.select().from(transactions);
      expect(rows.find((row) => row.id === learned.id)?.categorySlug).toBe(
        "software",
      );
      expect(rows.find((row) => row.id === other.id)?.categorySlug).toBeNull();
    });

    test("recurring transactions inherit monthly frequency only within their team", async () => {
      const category = (await createTransactionCategory(db, {
        teamId: fixture.teamA,
        name: "Software",
      }))!;
      const first = await transaction("Netflix", {
        categorySlug: category.slug!,
      });
      await updateTransaction(db, {
        id: first.id,
        teamId: fixture.teamA,
        recurring: true,
        frequency: "monthly",
      });
      const next = await transaction("Netflix", {
        categorySlug: category.slug!,
        date: "2026-02-01",
      });
      const other = await transaction("Netflix", {
        teamId: fixture.teamB,
        date: "2026-02-01",
      });
      const rows = await db.select().from(transactions);
      expect(rows.find((row) => row.id === next.id)).toMatchObject({
        recurring: true,
        frequency: "monthly",
      });
      expect(rows.find((row) => row.id === other.id)).toMatchObject({
        recurring: false,
        frequency: null,
      });
    });

    test("document insert/update populate language vectors used by the query", async () => {
      expect(fixture.a.document.ftsEnglish).toContain("annual");
      const updated = await updateDocumentByPath(db, {
        teamId: fixture.teamA,
        pathTokens: fixture.a.document.pathTokens!,
        title: "Nordic bookkeeping",
        summary: "Svenska fakturor",
        language: "swedish",
      });
      expect(updated![0]!.ftsEnglish).toContain("bookkeep");
      expect(updated![0]!.ftsLanguage).toBeTruthy();
      const result = await getDocuments(db, {
        teamId: fixture.teamA,
        q: "bookkeeping",
      });
      expect(result.data.map((row) => row.id)).toEqual([fixture.a.document.id]);
      expect(
        (await getDocuments(db, { teamId: fixture.teamB, q: "bookkeeping" }))
          .data,
      ).toEqual([]);
    });

    test("global search returns caller fields for every type and excludes the other team", async () => {
      await transaction("Acme transaction");
      await transaction("Acme transaction", { teamId: fixture.teamB });
      await createInbox(db, {
        teamId: fixture.teamB,
        filePath: [fixture.teamB, "acme.pdf"],
        fileName: "acme.pdf",
        displayName: "Acme receipt",
        contentType: "application/pdf",
        size: 12,
      });
      await createInbox(db, {
        teamId: fixture.teamA,
        filePath: [fixture.teamA, "acme.pdf"],
        fileName: "acme.pdf",
        displayName: "Acme receipt",
        contentType: "application/pdf",
        size: 12,
      });
      for (const searchTerm of ["acme", ""]) {
        const result = await globalSearchQuery(db, {
          teamId: fixture.teamA,
          searchTerm,
        });
        expect(new Set(result.map((row) => row.type))).toEqual(
          new Set([
            "customer",
            "invoice",
            "vault",
            "tracker_project",
            "transaction",
            "inbox",
          ]),
        );
        for (const row of result) {
          expect(row.data.team_id).toBe(fixture.teamA);
          expect(typeof row.title).toBe("string");
        }
        expect(result.find((row) => row.type === "vault")!.data).toMatchObject({
          metadata: { mimetype: "application/pdf" },
        });
        expect(
          result.find((row) => row.type === "transaction")!.data.url,
        ).toContain("/transactions?");
      }
    });

    test("semantic search applies type/status/currency/amount filters within the team", async () => {
      const result = await globalSemanticSearchQuery(db, {
        teamId: fixture.teamA,
        searchTerm: "acme",
        itemsPerTableLimit: 5,
        types: ["invoices"],
        status: "paid",
        currency: "USD",
        amountMin: 1000,
        amountMax: 2000,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: fixture.a.invoice.id,
        type: "invoice",
        data: { team_id: fixture.teamA, status: "paid" },
      });
    });

    test("related documents exclude source and foreign teams, including a foreign source ID", async () => {
      const result = await getRelatedDocuments(db, {
        teamId: fixture.teamA,
        id: fixture.a.document.id,
        pageSize: 5,
      });
      expect(result.map((row) => row.id)).toEqual([fixture.a.related.id]);
      expect(
        await getRelatedDocuments(db, {
          teamId: fixture.teamA,
          id: fixture.b.document.id,
          pageSize: 5,
        }),
      ).toEqual([]);
    });

    test("tracker callers return duration, amount, and assigned users within their team", async () => {
      const result = await getTrackerProjects(db, { teamId: fixture.teamA });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: fixture.a.project.id,
        teamId: fixture.teamA,
        totalDuration: 5400,
        totalAmount: 1500,
        users: [{ id: fixture.userId }],
      });
    });

    test("invoice updates advance updated_at without modifying another team", async () => {
      const updated = await updateInvoice(db, {
        teamId: fixture.teamA,
        id: fixture.a.invoice.id,
        status: "canceled",
      });
      expect(new Date(updated!.updatedAt!).getTime()).toBeGreaterThan(
        new Date(fixture.a.invoice.updatedAt!).getTime(),
      );
      expect(
        await updateInvoice(db, {
          teamId: fixture.teamA,
          id: fixture.b.invoice.id,
          status: "canceled",
        }),
      ).toBeUndefined();
    });

    test("migration installs all eleven parity triggers", async () => {
      const result = await db.execute(
        sql`SELECT count(*)::integer AS count FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND NOT t.tgisinternal AND t.tgname IN ('generate_category_slug', 'trigger_update_transactions_category', 'trigger_calculate_transaction_base_amount_before_insert', 'trigger_calculate_bank_account_base_balance_before_insert', 'trigger_calculate_bank_account_base_balance_before_update', 'trigger_calculate_inbox_base_amount_before_update', 'enrich_transaction', 'on_updated_transaction_category', 'check_recurring_transactions', 'documents_update_fts', 'invoices_set_updated_at')`,
      );
      expect(result.rows[0]!.count).toBe(11);
    });
  },
);
