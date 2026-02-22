#!/usr/bin/env bun

/**
 * Bank debug CLI — inspect raw provider data vs transformed vs DB-stored values.
 *
 * Usage:
 *   bun run packages/banking/scripts/debug.ts accounts     <bank_account_id>
 *   bun run packages/banking/scripts/debug.ts balance      <bank_account_id>
 *   bun run packages/banking/scripts/debug.ts transactions <bank_account_id> [--limit N]
 *
 * Requires DATABASE_PRIMARY_URL + provider API credentials in your environment.
 */

import { primaryDb as db } from "@midday/db/client";
import {
  bankAccounts,
  bankConnections,
  transactions as transactionsTable,
} from "@midday/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Provider } from "../src/index";
import { EnableBankingApi } from "../src/providers/enablebanking/enablebanking-api";
import {
  transformAccount as ebTransformAccount,
  transformBalance as ebTransformBalance,
  transformTransaction as ebTransformTransaction,
} from "../src/providers/enablebanking/transform";
import { GoCardLessApi } from "../src/providers/gocardless/gocardless-api";
import {
  transformAccount as gcTransformAccount,
  transformAccountBalance as gcTransformAccountBalance,
  transformTransaction as gcTransformTransaction,
} from "../src/providers/gocardless/transform";

// ── Formatting helpers ──────────────────────────────────────────────────────

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const header = (title: string) =>
  console.log(
    `\n${BOLD}${CYAN}━━━ ${title} ${"━".repeat(Math.max(0, 60 - title.length))}${RESET}\n`,
  );

const json = (obj: unknown) => console.log(JSON.stringify(obj, null, 2));

const ok = (msg: string) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const warn = (msg: string) => console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
const fail = (msg: string) => console.log(`  ${RED}✗${RESET} ${msg}`);
const dim = (msg: string) => console.log(`  ${DIM}${msg}${RESET}`);

// ── DB lookup (shared) ──────────────────────────────────────────────────────

async function loadAccount(bankAccountId: string) {
  const account = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!account) {
    console.error(`Bank account not found: ${bankAccountId}`);
    process.exit(1);
  }

  if (!account.bankConnectionId) {
    console.error(
      `Bank account ${bankAccountId} has no connection (manual account?)`,
    );
    process.exit(1);
  }

  const connection = await db
    .select()
    .from(bankConnections)
    .where(eq(bankConnections.id, account.bankConnectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!connection) {
    console.error(`Bank connection not found: ${account.bankConnectionId}`);
    process.exit(1);
  }

  header("STORED (DB)");
  console.log(`  Account:    ${BOLD}${account.name}${RESET} (${account.id})`);
  console.log(`  Account ID: ${account.accountId}`);
  console.log(`  Provider:   ${connection.provider}`);
  console.log(
    `  Currency:   ${account.currency}    Balance: ${account.balance}`,
  );
  console.log(`  Type:       ${account.type}    Enabled: ${account.enabled}`);
  console.log(`  Connection: ${connection.id} (${connection.status})`);
  if (connection.referenceId) {
    console.log(`  Reference:  ${connection.referenceId}`);
  }

  return { account, connection };
}

// ── Subcommand: accounts ────────────────────────────────────────────────────

async function debugAccounts(bankAccountId: string) {
  const { account, connection } = await loadAccount(bankAccountId);
  const provider = connection.provider;

  header("PROVIDER: ACCOUNTS (raw → transformed)");

  try {
    if (provider === "gocardless") {
      const api = new GoCardLessApi();
      const rawAccounts = await api.getAccounts({
        id: connection.referenceId!,
      });

      if (!rawAccounts?.length) {
        warn("Provider returned no accounts");
        return;
      }

      const matched = rawAccounts.find(
        (a) =>
          a.account.resourceId === account.accountId ||
          a.id === account.accountId,
      );

      if (!matched) {
        warn(
          `Could not match account_id="${account.accountId}" in provider response`,
        );
        dim(`Provider account IDs: ${rawAccounts.map((a) => a.id).join(", ")}`);
        dim(
          `Provider resourceIds: ${rawAccounts.map((a) => a.account.resourceId).join(", ")}`,
        );
        return;
      }

      console.log(`${DIM}Raw provider response:${RESET}`);
      json(matched);

      const transformed = gcTransformAccount(matched);
      console.log(`\n${DIM}Transformed:${RESET}`);
      json(transformed);

      console.log();
      diffField("currency", account.currency, transformed.currency);
      diffField("name", account.name, transformed.name);
      diffField("type", account.type, transformed.type);
    } else if (provider === "enablebanking") {
      const api = new EnableBankingApi();
      const rawAccounts = await api.getAccounts({
        id: connection.accessToken!,
      });

      const matched = rawAccounts.find(
        (a) =>
          a.uid === account.accountId ||
          a.identification_hash === account.accountId,
      );

      if (!matched) {
        warn(
          `Could not match account_id="${account.accountId}" in provider response`,
        );
        return;
      }

      console.log(`${DIM}Raw provider response:${RESET}`);
      json(matched);

      const transformed = ebTransformAccount(matched);
      console.log(`\n${DIM}Transformed:${RESET}`);
      json(transformed);

      console.log();
      diffField("currency", account.currency, transformed.currency);
      diffField("name", account.name, transformed.name);
      diffField("type", account.type, transformed.type);
    } else {
      const providerInstance = new Provider({ provider });
      const accounts = await providerInstance.getAccounts({
        id: connection.referenceId ?? connection.enrollmentId ?? "",
        accessToken: connection.accessToken ?? undefined,
        institutionId: connection.institutionId,
      });

      const matched = accounts.find(
        (a) =>
          a.id === account.accountId || a.resource_id === account.accountId,
      );
      if (!matched) {
        warn(
          `Could not match account_id="${account.accountId}" in provider response`,
        );
        return;
      }

      console.log(
        `${DIM}Transformed (raw not available for ${provider}):${RESET}`,
      );
      json(matched);

      console.log();
      diffField("currency", account.currency, matched.currency);
      diffField("name", account.name, matched.name);
      diffField("type", account.type, matched.type);
    }
  } catch (error) {
    fail(
      `Provider error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ── Subcommand: balance ─────────────────────────────────────────────────────

async function debugBalance(bankAccountId: string) {
  const { account, connection } = await loadAccount(bankAccountId);
  const provider = connection.provider;

  header("PROVIDER: BALANCE (raw)");

  try {
    if (provider === "gocardless") {
      const api = new GoCardLessApi();
      const raw = await api.getAccountBalances(account.accountId);

      console.log(`${DIM}Raw balances array:${RESET}`);
      json(raw.balances);
      console.log(`\n${DIM}Primary balance:${RESET}`);
      json(raw.primaryBalance);

      header("PROVIDER: BALANCE (transformed)");
      const transformed = gcTransformAccountBalance({
        balance: raw.primaryBalance,
        balances: raw.balances,
        accountType: account.type ?? undefined,
      });
      json(transformed);

      header("DIFF");
      diffField("currency", account.currency, transformed.currency);
      diffNumeric("balance", Number(account.balance), transformed.amount);
      diffNumeric(
        "available_balance",
        Number(account.availableBalance),
        transformed.available_balance,
      );
    } else if (provider === "enablebanking") {
      const api = new EnableBankingApi();
      const raw = await api.getAccountBalance(account.accountId);

      console.log(`${DIM}Raw balance (highest):${RESET}`);
      json(raw.balance);
      console.log(`\n${DIM}All balances:${RESET}`);
      json(raw.balances);
      if (raw.creditLimit) {
        console.log(`\n${DIM}Credit limit:${RESET}`);
        json(raw.creditLimit);
      }

      header("PROVIDER: BALANCE (transformed)");
      const transformed = ebTransformBalance({
        balance: raw.balance,
        balances: raw.balances,
        creditLimit: raw.creditLimit,
        accountType: account.type ?? undefined,
      });
      json(transformed);

      header("DIFF");
      diffField("currency", account.currency, transformed.currency);
      diffNumeric("balance", Number(account.balance), transformed.amount);
      diffNumeric(
        "available_balance",
        Number(account.availableBalance),
        transformed.available_balance,
      );
    } else {
      const providerInstance = new Provider({ provider });
      const transformed = await providerInstance.getAccountBalance({
        accountId: account.accountId,
        accessToken: connection.accessToken ?? undefined,
        accountType: account.type ?? undefined,
      });

      console.log(
        `${DIM}Transformed (raw not available for ${provider}):${RESET}`,
      );
      json(transformed);

      header("DIFF");
      diffField("currency", account.currency, transformed.currency);
      diffNumeric("balance", Number(account.balance), transformed.amount);
      diffNumeric(
        "available_balance",
        Number(account.availableBalance),
        transformed.available_balance,
      );
    }
  } catch (error) {
    fail(
      `Provider error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ── Subcommand: transactions ────────────────────────────────────────────────

async function debugTransactions(bankAccountId: string, limit: number) {
  const { account, connection } = await loadAccount(bankAccountId);
  const provider = connection.provider;

  // Load recent DB transactions for comparison
  const dbTransactions = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.bankAccountId, bankAccountId),
        eq(transactionsTable.teamId, account.teamId),
      ),
    )
    .orderBy(desc(transactionsTable.date))
    .limit(limit * 2);

  const dbByInternalId = new Map(
    dbTransactions.map((tx) => [tx.internalId, tx]),
  );

  header(`PROVIDER: TRANSACTIONS (limit ${limit})`);

  try {
    if (provider === "gocardless") {
      const api = new GoCardLessApi();
      const rawTxs = await api.getTransactions({
        accountId: account.accountId,
        latest: true,
      });

      if (!rawTxs?.length) {
        warn("Provider returned no transactions");
        return;
      }

      const sliced = rawTxs.slice(0, limit);

      for (let i = 0; i < sliced.length; i++) {
        const raw = sliced[i]!;
        const transformed = gcTransformTransaction({
          transaction: raw,
          accountType: account.type ?? "depository",
        });

        console.log(`\n${BOLD}── Transaction ${i + 1} ──${RESET}`);
        console.log(`${DIM}Raw:${RESET}`);
        json(raw);
        console.log(`${DIM}Transformed:${RESET}`);
        json(transformed);

        const dbMatch = dbByInternalId.get(transformed.id);
        if (dbMatch) {
          ok(`DB match: ${dbMatch.id}`);
          diffNumeric("amount", Number(dbMatch.amount), transformed.amount);
          diffField("currency", dbMatch.currency, transformed.currency);
          diffField("date", dbMatch.date, transformed.date);
        } else {
          warn(`Not found in DB (internal_id: ${transformed.id})`);
        }
      }

      header("SUMMARY");
      console.log(`  Provider returned: ${rawTxs.length} transactions`);
      console.log(`  Showing: ${sliced.length}`);
      console.log(`  DB transactions loaded: ${dbTransactions.length}`);
    } else if (provider === "enablebanking") {
      const api = new EnableBankingApi();
      const raw = await api.getTransactions({
        accountId: account.accountId,
        accountType: account.type ?? "depository",
        latest: true,
      });

      if (!raw.transactions.length) {
        warn("Provider returned no transactions");
        return;
      }

      const sliced = raw.transactions.slice(0, limit);

      for (let i = 0; i < sliced.length; i++) {
        const rawTx = sliced[i]!;
        const transformed = ebTransformTransaction({
          transaction: rawTx,
          accountType: account.type ?? "depository",
        });

        console.log(`\n${BOLD}── Transaction ${i + 1} ──${RESET}`);
        console.log(`${DIM}Raw:${RESET}`);
        json(rawTx);
        console.log(`${DIM}Transformed:${RESET}`);
        json(transformed);

        const dbMatch = dbByInternalId.get(transformed.id);
        if (dbMatch) {
          ok(`DB match: ${dbMatch.id}`);
          diffNumeric("amount", Number(dbMatch.amount), transformed.amount);
          diffField("currency", dbMatch.currency, transformed.currency);
          diffField("date", dbMatch.date, transformed.date);
        } else {
          warn(`Not found in DB (internal_id: ${transformed.id})`);
        }
      }

      header("SUMMARY");
      console.log(
        `  Provider returned: ${raw.transactions.length} transactions`,
      );
      console.log(`  Showing: ${sliced.length}`);
      console.log(`  DB transactions loaded: ${dbTransactions.length}`);
    } else {
      const providerInstance = new Provider({ provider });
      const txs = await providerInstance.getTransactions({
        accountId: account.accountId,
        accessToken: connection.accessToken ?? undefined,
        accountType: account.type ?? "depository",
        latest: true,
      });

      const sliced = txs.slice(0, limit);

      for (let i = 0; i < sliced.length; i++) {
        const transformed = sliced[i]!;

        console.log(`\n${BOLD}── Transaction ${i + 1} ──${RESET}`);
        console.log(
          `${DIM}Transformed (raw not available for ${provider}):${RESET}`,
        );
        json(transformed);

        const dbMatch = dbByInternalId.get(transformed.id);
        if (dbMatch) {
          ok(`DB match: ${dbMatch.id}`);
          diffNumeric("amount", Number(dbMatch.amount), transformed.amount);
          diffField("currency", dbMatch.currency, transformed.currency);
          diffField("date", dbMatch.date, transformed.date);
        } else {
          warn(`Not found in DB (internal_id: ${transformed.id})`);
        }
      }

      header("SUMMARY");
      console.log(`  Provider returned: ${txs.length} transactions`);
      console.log(`  Showing: ${sliced.length}`);
      console.log(`  DB transactions loaded: ${dbTransactions.length}`);
    }
  } catch (error) {
    fail(
      `Provider error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ── Diff helpers ────────────────────────────────────────────────────────────

function diffField(label: string, stored: unknown, provider: unknown) {
  if (String(stored ?? "") === String(provider ?? "")) {
    ok(`${label}: ${stored}`);
  } else {
    fail(
      `${label}: stored=${JSON.stringify(stored)}  provider=${JSON.stringify(provider)}`,
    );
  }
}

function diffNumeric(
  label: string,
  stored: number | null | undefined,
  provider: number | null | undefined,
) {
  const s = stored ?? 0;
  const p = provider ?? 0;
  if (Math.abs(s - p) < 0.005) {
    ok(`${label}: ${s}`);
  } else {
    fail(`${label}: stored=${s}  provider=${p}  (delta=${(p - s).toFixed(2)})`);
  }
}

// ── CLI entry point ─────────────────────────────────────────────────────────

const USAGE = `
Usage:
  bun run packages/banking/scripts/debug.ts accounts     <bank_account_id>
  bun run packages/banking/scripts/debug.ts balance      <bank_account_id>
  bun run packages/banking/scripts/debug.ts transactions <bank_account_id> [--limit N]
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const bankAccountId = args[1];

  if (!command || !bankAccountId) {
    console.log(USAGE);
    process.exit(1);
  }

  const limitIdx = args.indexOf("--limit");
  const limit =
    limitIdx !== -1 ? Number.parseInt(args[limitIdx + 1] ?? "10", 10) : 10;

  switch (command) {
    case "accounts":
      await debugAccounts(bankAccountId);
      break;
    case "balance":
      await debugBalance(bankAccountId);
      break;
    case "transactions":
      await debugTransactions(bankAccountId, limit);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(USAGE);
      process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Debug script failed:", error);
  process.exit(1);
});
