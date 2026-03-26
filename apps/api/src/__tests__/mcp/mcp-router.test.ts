import "../setup";
import { describe, expect, test } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  mcpTransactionSchema,
  sanitize,
  sanitizeArray,
} from "../../mcp/schemas";
import { createMcpServer } from "../../mcp/server";
import type { McpContext } from "../../mcp/types";
import { mcpRouter } from "../../rest/routers/mcp";

describe("MCP server", () => {
  test("createMcpServer registers transaction write tools when scopes include write", () => {
    const server = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      userEmail: "test@example.com",
      scopes: [
        "transactions.read",
        "transactions.write",
        "tags.read",
        "tags.write",
        "invoices.read",
        "invoices.write",
        "reports.read",
        "search.read",
        "teams.read",
        "customers.read",
        "customers.write",
        "bank-accounts.read",
        "documents.read",
        "documents.write",
        "inbox.read",
        "inbox.write",
        "tracker-projects.read",
        "tracker-projects.write",
        "tracker-entries.read",
        "tracker-entries.write",
      ],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    expect(names).toContain("transactions_list");
    expect(names).toContain("transactions_create");
    expect(names).toContain("transactions_export");
    expect(names).toContain("transactions_export_to_accounting");
    expect(names).toContain("export_job_status");
    expect(names).toContain("accounting_connections");
    expect(names).toContain("accounting_sync_status");
    expect(names).toContain("tags_create");

    expect(names).toContain("categories_list");
    expect(names).toContain("categories_create");
    expect(names).toContain("categories_update");
    expect(names).toContain("categories_delete");

    expect(names).toContain("invoice_products_list");
    expect(names).toContain("invoice_products_create");

    expect(names).toContain("invoice_recurring_list");
    expect(names).toContain("invoice_recurring_create");
    expect(names).toContain("invoice_recurring_pause");
    expect(names).toContain("invoice_recurring_upcoming");

    expect(names).toContain("inbox_update");
    expect(names).toContain("inbox_delete");
    expect(names).toContain("inbox_match_transaction");
    expect(names).toContain("inbox_confirm_match");

    expect(names).toContain("bank_accounts_balances");
    expect(names).toContain("bank_accounts_currencies");
    expect(names).toContain("bank_accounts_details");

    expect(names).toContain("documents_delete");
    expect(names).toContain("document_tags_list");
    expect(names).toContain("document_tags_create");
    expect(names).toContain("document_tags_assign");
  });

  test("createMcpServer registers invoice write tools when scopes include invoices.write", () => {
    const server = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      userEmail: "test@example.com",
      scopes: [
        "invoices.read",
        "invoices.write",
        "transactions.read",
        "tags.read",
        "reports.read",
        "search.read",
        "teams.read",
        "customers.read",
        "bank-accounts.read",
        "documents.read",
        "inbox.read",
        "tracker-projects.read",
        "tracker-entries.read",
      ],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    expect(names).toContain("invoices_list");
    expect(names).toContain("invoices_create");
    expect(names).toContain("invoices_update_draft");
    expect(names).toContain("invoices_send");
    expect(names).toContain("invoices_remind");
    expect(names).toContain("invoices_cancel");
    expect(names).toContain("invoices_mark_paid");
    expect(names).toContain("invoices_create_from_tracker");
    expect(names).toContain("invoices_search_number");
    expect(names).toContain("invoices_payment_status");
    expect(names).toContain("invoices_analytics");
  });

  test("export_job_status and accounting_connections require transactions.write scope", () => {
    const writeOnly = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      userEmail: "test@example.com",
      scopes: [
        "transactions.write",
        "tags.read",
        "reports.read",
        "search.read",
        "teams.read",
        "customers.read",
        "bank-accounts.read",
        "documents.read",
        "inbox.read",
        "tracker-projects.read",
        "tracker-entries.read",
      ],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const writeNames = Object.keys(
      (writeOnly as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    expect(writeNames).toContain("transactions_export");
    expect(writeNames).toContain("transactions_export_to_accounting");
    expect(writeNames).toContain("export_job_status");
    expect(writeNames).toContain("accounting_connections");
    expect(writeNames).not.toContain("transactions_list");
    expect(writeNames).not.toContain("accounting_sync_status");

    const readOnly = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      userEmail: "test@example.com",
      scopes: [
        "transactions.read",
        "tags.read",
        "reports.read",
        "search.read",
        "teams.read",
        "customers.read",
        "bank-accounts.read",
        "documents.read",
        "inbox.read",
        "tracker-projects.read",
        "tracker-entries.read",
      ],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const readNames = Object.keys(
      (readOnly as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    expect(readNames).toContain("transactions_list");
    expect(readNames).toContain("accounting_sync_status");
    expect(readNames).not.toContain("export_job_status");
    expect(readNames).not.toContain("accounting_connections");
    expect(readNames).not.toContain("transactions_export");
  });

  test("no tools registered when scopes are empty", () => {
    const server = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      userEmail: "test@example.com",
      scopes: [],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    expect(names).toHaveLength(0);
  });

  test("read-only scopes do not register write tools for any domain", () => {
    const server = createMcpServer({
      db: {} as McpContext["db"],
      teamId: "test-team-id",
      userId: "test-user-id",
      userEmail: "test@example.com",
      scopes: [
        "transactions.read",
        "tags.read",
        "invoices.read",
        "reports.read",
        "search.read",
        "teams.read",
        "customers.read",
        "bank-accounts.read",
        "documents.read",
        "inbox.read",
        "tracker-projects.read",
        "tracker-entries.read",
      ],
      apiUrl: "https://api.midday.ai",
      timezone: "UTC",
      locale: "en",
      countryCode: "US",
      dateFormat: null,
      timeFormat: 24,
    });

    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );

    const readTools = [
      "transactions_list",
      "transactions_get",
      "invoices_list",
      "invoices_get",
      "customers_list",
      "customers_get",
      "bank_accounts_list",
      "documents_list",
      "inbox_list",
      "tags_list",
      "team_get",
      "search_global",
      "tracker_projects_list",
      "tracker_entries_list",
      "reports_revenue",
      "categories_list",
      "invoice_products_list",
      "invoice_recurring_list",
    ];
    for (const tool of readTools) {
      expect(names).toContain(tool);
    }

    const writeTools = [
      "transactions_create",
      "transactions_update",
      "transactions_delete",
      "transactions_export",
      "transactions_export_to_accounting",
      "export_job_status",
      "accounting_connections",
      "invoices_create",
      "invoices_send",
      "invoices_update",
      "invoices_delete",
      "customers_create",
      "customers_update",
      "customers_delete",
      "documents_delete",
      "inbox_update",
      "inbox_delete",
      "tags_create",
      "tags_update",
      "tags_delete",
      "tracker_projects_create",
      "tracker_projects_delete",
      "tracker_entries_create",
      "tracker_entries_delete",
      "categories_create",
      "categories_update",
      "categories_delete",
      "invoice_products_create",
      "invoice_recurring_create",
    ];
    for (const tool of writeTools) {
      expect(names).not.toContain(tool);
    }
  });

  test("mcp router returns 401 when Authorization is missing", async () => {
    const app = new OpenAPIHono();
    app.route("/mcp", mcpRouter);

    const res = await app.request("http://test/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unauthorized");
  });
});

describe("sanitize", () => {
  test("strips unknown keys from objects", () => {
    const raw = {
      id: "abc",
      date: "2024-01-01",
      name: "Coffee",
      amount: -4.5,
      currency: "USD",
      status: "posted",
      teamId: "secret-team-id",
      internalId: 999,
      createdBy: "user-123",
      bankConnectionAccessToken: "sk_live_xxx",
    };

    const clean = sanitize(mcpTransactionSchema, raw);

    expect(clean.id).toBe("abc");
    expect(clean.name).toBe("Coffee");
    expect(clean.amount).toBe(-4.5);
    expect((clean as Record<string, unknown>).teamId).toBeUndefined();
    expect((clean as Record<string, unknown>).internalId).toBeUndefined();
    expect((clean as Record<string, unknown>).createdBy).toBeUndefined();
    expect(
      (clean as Record<string, unknown>).bankConnectionAccessToken,
    ).toBeUndefined();
  });

  test("sanitizeArray strips unknown keys from every item", () => {
    const raw = [
      {
        id: "1",
        date: "2024-01-01",
        name: "A",
        amount: 10,
        currency: "USD",
        status: "posted",
        secret: "leaked",
      },
      {
        id: "2",
        date: "2024-01-02",
        name: "B",
        amount: 20,
        currency: "EUR",
        status: "posted",
        secret: "also leaked",
      },
    ];

    const clean = sanitizeArray(mcpTransactionSchema, raw);

    expect(clean).toHaveLength(2);
    expect(clean[0]!.id).toBe("1");
    expect((clean[0] as Record<string, unknown>).secret).toBeUndefined();
    expect(clean[1]!.id).toBe("2");
    expect((clean[1] as Record<string, unknown>).secret).toBeUndefined();
  });

  test("preserves nullable/optional fields correctly", () => {
    const raw = {
      id: "abc",
      date: "2024-01-01",
      name: "Coffee",
      amount: -4.5,
      currency: "USD",
      status: "posted",
      note: null,
      description: undefined,
      category: null,
      tags: [{ id: "t1", name: "food", extraField: true }],
    };

    const clean = sanitize(mcpTransactionSchema, raw);

    expect(clean.note).toBeNull();
    expect(clean.category).toBeNull();
    expect(clean.tags).toHaveLength(1);
    expect(clean.tags![0]!.name).toBe("food");
    expect(
      (clean.tags![0] as Record<string, unknown>).extraField,
    ).toBeUndefined();
  });
});
