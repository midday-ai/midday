#!/usr/bin/env bun

/**
 * Bank debug CLI — inspect raw provider data vs transformed vs DB-stored values.
 *
 * Usage:
 *   bun run packages/banking/scripts/debug.ts connection   <bank_connection_id>
 *   bun run packages/banking/scripts/debug.ts reconnect    <bank_connection_id>
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
import { setLogLevel } from "@midday/logger";
import {
  type ApiAccount,
  type DbAccount,
  findMatchingAccount,
} from "@midday/supabase/account-matching";
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
import type { Account } from "../src/types";
import type { AccountType } from "../src/utils/account";

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

async function loadConnection(bankConnectionId: string) {
  const connection = await db
    .select()
    .from(bankConnections)
    .where(eq(bankConnections.id, bankConnectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!connection) {
    console.error(`Bank connection not found: ${bankConnectionId}`);
    process.exit(1);
  }

  const accounts = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.bankConnectionId, bankConnectionId));

  return { connection, accounts };
}

// ── Subcommand: connection ──────────────────────────────────────────────────

async function debugConnection(bankConnectionId: string) {
  const { connection, accounts } = await loadConnection(bankConnectionId);
  const provider = connection.provider;

  header("STORED (DB) — Connection");
  console.log(`  ID:           ${BOLD}${connection.id}${RESET}`);
  console.log(`  Name:         ${connection.name}`);
  console.log(`  Provider:     ${provider}`);
  console.log(`  Status:       ${connection.status}`);
  console.log(`  Institution:  ${connection.institutionId}`);
  if (connection.referenceId) {
    console.log(`  Reference:    ${connection.referenceId}`);
  }
  if (connection.enrollmentId) {
    console.log(`  Enrollment:   ${connection.enrollmentId}`);
  }
  if (connection.expiresAt) {
    const exp = new Date(connection.expiresAt);
    const daysLeft = Math.round(
      (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const color = daysLeft < 14 ? RED : daysLeft < 30 ? YELLOW : GREEN;
    console.log(
      `  Expires:      ${connection.expiresAt} (${color}${daysLeft} days${RESET})`,
    );
  }
  if (connection.errorDetails) {
    console.log(`  Error:        ${RED}${connection.errorDetails}${RESET}`);
  }

  header(`LINKED ACCOUNTS (${accounts.length})`);
  for (const acct of accounts) {
    const enabledTag = acct.enabled
      ? `${GREEN}enabled${RESET}`
      : `${DIM}disabled${RESET}`;
    console.log(
      `  ${BOLD}${acct.name}${RESET}  ${acct.currency} ${acct.balance}  ${acct.type}  ${enabledTag}`,
    );
    console.log(
      `    ${DIM}id=${acct.id}  account_id=${acct.accountId}${RESET}`,
    );
  }

  header("PROVIDER STATUS");

  try {
    if (provider === "gocardless") {
      const api = new GoCardLessApi();

      const requisition = await api.getRequestion(connection.referenceId!);
      if (!requisition) {
        fail("Requisition not found");
        return;
      }

      console.log(`  Requisition ID: ${requisition.id}`);
      console.log(
        `  Status:         ${formatRequisitionStatus(requisition.status)}`,
      );
      console.log(`  Created:        ${requisition.created}`);
      console.log(`  Institution:    ${requisition.institution_id}`);
      console.log(
        `  Accounts:       ${requisition.accounts.length} (${requisition.accounts.join(", ")})`,
      );

      const agreement = await api.getEndUserAgreement(requisition.agreement);
      console.log();
      console.log(`  Agreement ID:              ${agreement.id}`);
      console.log(
        `  access_valid_for_days:     ${agreement.access_valid_for_days}`,
      );
      console.log(
        `  max_historical_days:       ${agreement.max_historical_days}`,
      );
      console.log(`  accepted:                  ${agreement.accepted}`);
      console.log(`  created:                   ${agreement.created}`);

      const accountMismatch = requisition.accounts.filter(
        (provId) => !accounts.some((a) => a.accountId === provId),
      );
      if (accountMismatch.length) {
        warn(`Provider accounts not in DB: ${accountMismatch.join(", ")}`);
      }
    } else if (provider === "enablebanking") {
      const api = new EnableBankingApi();

      const session = await api.getSession(connection.accessToken!);
      console.log(`  Session ID:    ${session.session_id}`);
      console.log(`  Status:        ${session.status}`);
      console.log(
        `  Bank:          ${session.aspsp.name} (${session.aspsp.country})`,
      );
      console.log(`  PSU type:      ${session.psu_type}`);
      console.log(`  Valid until:   ${session.access.valid_until}`);
      console.log(
        `  Accounts:      ${session.accounts.length} (${session.accounts.join(", ")})`,
      );
      console.log(`  Balances:      ${session.access.balances}`);
      console.log(`  Transactions:  ${session.access.transactions}`);

      const daysLeft = Math.round(
        (new Date(session.access.valid_until).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      const color = daysLeft < 14 ? RED : daysLeft < 30 ? YELLOW : GREEN;
      console.log(`  Access TTL:    ${color}${daysLeft} days${RESET}`);
    } else {
      const providerInstance = new Provider({ provider });
      const status = await providerInstance.getConnectionStatus({
        id: connection.referenceId ?? "",
        accessToken: connection.accessToken ?? undefined,
      });
      console.log(`  Status: ${status.status}`);
    }
  } catch (error) {
    fail(
      `Provider error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function formatRequisitionStatus(
  status: "CR" | "GC" | "UA" | "RJ" | "SA" | "GA" | "LN" | "EX",
): string {
  const labels: Record<string, string> = {
    CR: `${YELLOW}CR (created)${RESET}`,
    GC: `${YELLOW}GC (giving consent)${RESET}`,
    UA: `${YELLOW}UA (undergoing authentication)${RESET}`,
    RJ: `${RED}RJ (rejected)${RESET}`,
    SA: `${YELLOW}SA (selecting accounts)${RESET}`,
    GA: `${YELLOW}GA (granting access)${RESET}`,
    LN: `${GREEN}LN (linked)${RESET}`,
    EX: `${RED}EX (expired)${RESET}`,
  };
  return labels[status] ?? status;
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
        balance: raw.primaryBalance?.balanceAmount,
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

// ── Subcommand: reconnect (dry-run) ─────────────────────────────────────────

function toApiAccount(a: Account): ApiAccount {
  return {
    id: a.id,
    resource_id: a.resource_id,
    iban: a.iban,
    type: a.type,
    currency: a.currency,
    name: a.name,
  };
}

function toDbAccount(a: {
  id: string;
  accountId: string;
  accountReference: string | null;
  iban: string | null;
  type: string | null;
  currency: string | null;
  name: string | null;
}): DbAccount {
  return {
    id: a.id,
    account_reference: a.accountReference,
    iban: a.iban,
    type: a.type,
    currency: a.currency,
    name: a.name,
  };
}

function detectMatchTier(apiAccount: ApiAccount, dbAccount: DbAccount): string {
  if (
    apiAccount.resource_id &&
    dbAccount.account_reference === apiAccount.resource_id
  ) {
    return `resource_id (${apiAccount.resource_id})`;
  }
  if (apiAccount.iban && dbAccount.iban === apiAccount.iban) {
    return `iban (${apiAccount.iban})`;
  }
  return `fuzzy (${[dbAccount.currency, dbAccount.type, dbAccount.name].filter(Boolean).join(", ")})`;
}

async function debugReconnect(bankConnectionId: string) {
  const { connection, accounts } = await loadConnection(bankConnectionId);
  const provider = connection.provider;

  header("STORED (DB)");
  console.log(
    `  Connection: ${BOLD}${connection.id}${RESET} (${connection.provider})`,
  );
  console.log(`  Accounts:   ${accounts.length}`);

  // Fetch provider accounts
  let apiAccounts: ApiAccount[];

  try {
    if (provider === "gocardless") {
      const api = new GoCardLessApi();
      const raw = await api.getAccounts({ id: connection.referenceId! });
      if (!raw?.length) {
        fail("Provider returned no accounts");
        return;
      }
      const transformed = raw.map((r) => gcTransformAccount(r));
      apiAccounts = transformed.map(toApiAccount);
    } else if (provider === "enablebanking") {
      const api = new EnableBankingApi();
      const raw = await api.getAccounts({ id: connection.accessToken! });
      if (!raw?.length) {
        fail("Provider returned no accounts");
        return;
      }
      const transformed = raw.map((r) => ebTransformAccount(r));
      apiAccounts = transformed.map(toApiAccount);
    } else {
      const providerInstance = new Provider({ provider });
      const raw = await providerInstance.getAccounts({
        id: connection.referenceId ?? connection.enrollmentId ?? "",
        accessToken: connection.accessToken ?? undefined,
        institutionId: connection.institutionId,
      });
      apiAccounts = raw.map(toApiAccount);
    }
  } catch (error) {
    fail(
      `Provider error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  console.log(`  Provider:   ${apiAccounts.length} accounts returned`);

  // Run matching
  const dbAccounts = accounts.map(toDbAccount);
  const matchedDbIds = new Set<string>();
  const matchedApiIds = new Set<string>();

  type MatchEntry = {
    db: (typeof accounts)[0];
    api: ApiAccount;
    tier: string;
  };
  const matched: MatchEntry[] = [];

  for (const api of apiAccounts) {
    const match = findMatchingAccount(api, dbAccounts, matchedDbIds);
    if (match) {
      matchedDbIds.add(match.id);
      matchedApiIds.add(api.id);
      const dbRow = accounts.find((a) => a.id === match.id)!;
      matched.push({ db: dbRow, api, tier: detectMatchTier(api, match) });
    }
  }

  const staleDbAccounts = accounts.filter((a) => !matchedDbIds.has(a.id));
  const newApiAccounts = apiAccounts.filter((a) => !matchedApiIds.has(a.id));

  header("RECONNECT DRY-RUN");

  for (const { db: dbRow, api, tier } of matched) {
    const changed = dbRow.accountId !== api.id;
    const arrow = changed
      ? `${dbRow.accountId}  →  ${BOLD}${api.id}${RESET}`
      : `${dbRow.accountId} ${DIM}(unchanged)${RESET}`;
    ok(`${BOLD}${dbRow.name}${RESET} (${dbRow.currency})`);
    console.log(`    db=${dbRow.id}  account_id=${arrow}`);
    console.log(`    ${DIM}matched by: ${tier}${RESET}`);
    console.log();
  }

  for (const dbRow of staleDbAccounts) {
    fail(
      `${BOLD}${dbRow.name}${RESET} (${dbRow.currency})  ${RED}← BROKEN${RESET}`,
    );
    console.log(`    db=${dbRow.id}  account_id=${dbRow.accountId}`);
    console.log(
      `    ${DIM}account_reference=${dbRow.accountReference ?? "null"}  iban=${dbRow.iban ?? "null"}  type=${dbRow.type ?? "null"}${RESET}`,
    );
    console.log(
      `    ${DIM}no matching provider account (resource_id, iban, currency+name all failed)${RESET}`,
    );
    console.log();
  }

  for (const api of newApiAccounts) {
    warn(`${api.id} ${BOLD}${api.name}${RESET} (${api.currency})`);
    console.log(
      `    ${DIM}resource_id=${api.resource_id ?? "null"}  iban=${api.iban ?? "null"}  type=${api.type}${RESET}`,
    );
    console.log(`    ${DIM}provider account not linked to any DB row${RESET}`);
    console.log();
  }

  header("SUMMARY");
  console.log(
    `  Matched: ${matched.length}    Stale: ${staleDbAccounts.length}    New: ${newApiAccounts.length}`,
  );

  // ── Suggested manual fixes ──────────────────────────────────────────────
  if (staleDbAccounts.length > 0 && newApiAccounts.length > 0) {
    header("SUGGESTED MANUAL FIXES");

    for (const dbRow of staleDbAccounts) {
      for (const api of newApiAccounts) {
        const signals: { label: string; pass: boolean; detail: string }[] = [];

        // 1. Count check — strongest when 1:1
        if (staleDbAccounts.length === 1 && newApiAccounts.length === 1) {
          signals.push({
            label: "1:1 orphan",
            pass: true,
            detail:
              "exactly one stale DB row and one unlinked provider account",
          });
        }

        // 2. Type match
        const typeOk = !dbRow.type || dbRow.type === api.type;
        signals.push({
          label: "type",
          pass: typeOk,
          detail: typeOk
            ? `both ${api.type}`
            : `db=${dbRow.type} vs provider=${api.type}`,
        });

        // 3. Currency compatibility (XXX = unknown, not a conflict)
        const dbCcy = dbRow.currency?.toUpperCase();
        const apiCcy = api.currency.toUpperCase();
        const ccyUnknown = !dbCcy || dbCcy === "XXX";
        const ccyMatch = ccyUnknown || dbCcy === apiCcy;
        signals.push({
          label: "currency",
          pass: ccyMatch,
          detail: ccyUnknown
            ? `db=${dbCcy ?? "null"} (unknown) — provider=${apiCcy} — not a conflict`
            : ccyMatch
              ? `both ${apiCcy}`
              : `db=${dbCcy} vs provider=${apiCcy} — CONFLICT`,
        });

        // 4. IBAN check
        if (dbRow.iban && api.iban) {
          const ibanOk = dbRow.iban === api.iban;
          signals.push({
            label: "iban",
            pass: ibanOk,
            detail: ibanOk
              ? `match (${api.iban})`
              : `db=${dbRow.iban} vs provider=${api.iban} — CONFLICT`,
          });
        }

        // 5. Name similarity
        const dbName = (dbRow.name ?? "").toLowerCase();
        const apiName = api.name.toLowerCase();
        const nameExact = dbName === apiName;
        const namePartial =
          !nameExact &&
          (dbName.includes(apiName) ||
            apiName.includes(dbName) ||
            dbName
              .split(/\s+/)
              .some((w) => w.length > 2 && apiName.includes(w)));
        signals.push({
          label: "name",
          pass: nameExact,
          detail: nameExact
            ? `exact match "${api.name}"`
            : namePartial
              ? `partial overlap: db="${dbRow.name}" vs provider="${api.name}"`
              : `different: db="${dbRow.name}" vs provider="${api.name}"`,
        });

        // 6. Transaction overlap — the strongest signal
        let txOverlap = 0;
        let txChecked = 0;
        let dateRangeNote = "";
        try {
          const dbTxs = await db
            .select({
              internalId: transactionsTable.internalId,
              amount: transactionsTable.amount,
              date: transactionsTable.date,
              currency: transactionsTable.currency,
            })
            .from(transactionsTable)
            .where(
              and(
                eq(transactionsTable.bankAccountId, dbRow.id),
                eq(transactionsTable.teamId, dbRow.teamId),
              ),
            )
            .orderBy(desc(transactionsTable.date))
            .limit(50);

          if (dbTxs.length > 0) {
            const providerTxIds: Set<string> = new Set();
            const providerTxFingerprints: Set<string> = new Set();
            const providerDates: string[] = [];
            const acctType = api.type as AccountType;

            if (provider === "gocardless") {
              const gcApi = new GoCardLessApi();
              const rawTxs = await gcApi.getTransactions({
                accountId: api.id,
                latest: false,
              });
              for (const raw of rawTxs ?? []) {
                const t = gcTransformTransaction({
                  transaction: raw,
                  accountType: acctType,
                });
                providerTxIds.add(t.id);
                providerTxFingerprints.add(`${t.date}|${t.amount}`);
                providerDates.push(t.date);
              }
            } else if (provider === "enablebanking") {
              const ebApi = new EnableBankingApi();
              const raw = await ebApi.getTransactions({
                accountId: api.id,
                accountType: acctType,
                latest: false,
              });
              for (const rawTx of raw.transactions) {
                const t = ebTransformTransaction({
                  transaction: rawTx,
                  accountType: acctType,
                });
                providerTxIds.add(t.id);
                providerTxFingerprints.add(`${t.date}|${t.amount}`);
                providerDates.push(t.date);
              }
            } else {
              const providerInstance = new Provider({ provider });
              const txs = await providerInstance.getTransactions({
                accountId: api.id,
                accessToken: connection.accessToken ?? undefined,
                accountType: acctType,
                latest: false,
              });
              for (const t of txs) {
                providerTxIds.add(t.id);
                providerTxFingerprints.add(`${t.date}|${t.amount}`);
                providerDates.push(t.date);
              }
            }

            txChecked = dbTxs.length;
            for (const dbTx of dbTxs) {
              const byId =
                dbTx.internalId && providerTxIds.has(dbTx.internalId);
              const byFingerprint = providerTxFingerprints.has(
                `${dbTx.date}|${Number(dbTx.amount)}`,
              );
              if (byId || byFingerprint) txOverlap++;
            }

            // Check if date ranges overlap
            const dbDates = dbTxs.map((t) => t.date).sort();
            const pDates = providerDates.sort();
            const dbMin = dbDates[0];
            const dbMax = dbDates[dbDates.length - 1];
            const pMin = pDates[0];
            const pMax = pDates[pDates.length - 1];

            if (dbMax && pMin && dbMax < pMin) {
              dateRangeNote = ` — date ranges don't overlap! db=${dbMin}..${dbMax}, provider=${pMin}..${pMax}`;
            } else if (dbMin && pMax && pMax < dbMin) {
              dateRangeNote = ` — date ranges don't overlap! db=${dbMin}..${dbMax}, provider=${pMin}..${pMax}`;
            } else if (dbMin && pMin) {
              dateRangeNote = ` — db=${dbMin}..${dbMax}, provider=${pMin}..${pMax}`;
            }
          }
        } catch {
          // Transaction fetch failed — skip this signal
        }

        if (txChecked > 0) {
          const pct = Math.round((txOverlap / txChecked) * 100);
          const noOverlappingRange = dateRangeNote.includes("don't overlap");
          signals.push({
            label: "tx overlap",
            pass: pct >= 30 || noOverlappingRange,
            detail: `${txOverlap}/${txChecked} (${pct}%)${dateRangeNote}`,
          });
        }

        // Print pair assessment
        console.log(
          `  ${BOLD}${dbRow.name}${RESET} (${dbRow.currency})  ↔  ${BOLD}${api.name}${RESET} (${api.currency})`,
        );
        console.log();

        const passing = signals.filter((s) => s.pass).length;
        for (const s of signals) {
          const icon = s.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
          console.log(`    ${icon} ${s.label}: ${s.detail}`);
        }

        // Confidence verdict
        const hardConflicts = signals.filter(
          (s) => !s.pass && ["currency", "type", "iban"].includes(s.label),
        );
        const txSignal = signals.find((s) => s.label === "tx overlap");
        const txRangesDisjoint =
          txSignal?.detail.includes("don't overlap") ?? false;
        const txConfirmed = txSignal?.pass === true && !txRangesDisjoint;
        const txRefuted = txSignal && !txSignal.pass && !txRangesDisjoint;

        let confidence: string;
        if (hardConflicts.length > 0) {
          confidence = `${RED}LOW — hard conflict on ${hardConflicts.map((c) => c.label).join(", ")}${RESET}`;
        } else if (txConfirmed && passing >= signals.length - 1) {
          confidence = `${GREEN}HIGH — transaction data confirms match${RESET}`;
        } else if (txRefuted) {
          confidence = `${YELLOW}MEDIUM — overlapping date range but 0% tx match, verify manually${RESET}`;
        } else if (
          staleDbAccounts.length === 1 &&
          newApiAccounts.length === 1 &&
          hardConflicts.length === 0
        ) {
          confidence = `${GREEN}HIGH — 1:1 with no conflicts${RESET}`;
        } else if (passing >= Math.ceil(signals.length / 2)) {
          confidence = `${YELLOW}MEDIUM — ${passing}/${signals.length} checks pass, review carefully${RESET}`;
        } else {
          confidence = `${RED}LOW — most checks failed${RESET}`;
        }

        console.log();
        console.log(`    Confidence: ${confidence}`);

        // SQL — mirrors what matchAndUpdateAccountIds does on reconnect
        const setClauses = [`account_id = '${api.id}'`];
        if (api.resource_id) {
          setClauses.push(`account_reference = '${api.resource_id}'`);
        }
        if (api.iban) {
          setClauses.push(`iban = '${api.iban}'`);
        }
        if (
          dbRow.currency?.toUpperCase() !== api.currency.toUpperCase() ||
          dbRow.currency === "XXX"
        ) {
          setClauses.push(`currency = '${api.currency}'`);
        }
        if (dbRow.name !== api.name) {
          setClauses.push(`name = '${api.name.replace(/'/g, "''")}'`);
        }

        console.log();
        console.log(`    ${DIM}SQL:${RESET}`);
        console.log(
          `    ${DIM}UPDATE bank_accounts SET ${setClauses.join(", ")} WHERE id = '${dbRow.id}';${RESET}`,
        );
        console.log();
      }
    }
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
  bun run packages/banking/scripts/debug.ts connection   <bank_connection_id>
  bun run packages/banking/scripts/debug.ts reconnect    <bank_connection_id>
  bun run packages/banking/scripts/debug.ts accounts     <bank_account_id>
  bun run packages/banking/scripts/debug.ts balance      <bank_account_id>
  bun run packages/banking/scripts/debug.ts transactions <bank_account_id> [--limit N]
`;

async function main() {
  setLogLevel("error");

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
    case "connection":
      await debugConnection(bankAccountId);
      break;
    case "reconnect":
      await debugReconnect(bankAccountId);
      break;
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
