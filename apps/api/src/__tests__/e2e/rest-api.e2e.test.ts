/**
 * Production-grade E2E tests for the Midday REST API.
 *
 * Runs against a live API server (localhost or production).
 * Every test that creates data cleans up after itself.
 *
 * Usage:
 *   API_BASE_URL=http://localhost:3003 MIDDAY_API_KEY=mid_... bun test src/__tests__/e2e/
 *
 * Environment variables:
 *   API_BASE_URL  - defaults to http://localhost:3003
 *   MIDDAY_API_KEY - required, no default
 */
import { afterAll, describe, expect, test } from "bun:test";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3003";
const API_KEY = process.env.MIDDAY_API_KEY;

if (!API_KEY) {
  throw new Error(
    "MIDDAY_API_KEY env var is required. Set it to a valid API key for the test team.",
  );
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429) {
      if (attempt < maxRetries) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? Number(retryAfter) * 1000
          : 2000 * (attempt + 1);
        await sleep(waitMs);
        continue;
      }
      throw new Error(
        `Rate limited after ${maxRetries} retries: ${method} ${path}`,
      );
    }

    const data = (await res.json().catch(() => null)) as T;
    return { status: res.status, data };
  }
  throw new Error(`No response after ${maxRetries} retries: ${method} ${path}`);
}

// ---------------------------------------------------------------------------
// Customers CRUD
// ---------------------------------------------------------------------------
describe("Customers CRUD", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await api("DELETE", `/customers/${id}`);
    }
  });

  test("POST /customers -> 201", async () => {
    const { status, data } = await api<any>("POST", "/customers", {
      name: "E2E Test Customer",
      email: "e2e-test@midday.ai",
    });

    expect(status).toBe(201);
    expect(data.id).toBeDefined();
    expect(data.name).toBe("E2E Test Customer");
    expect(data.email).toBe("e2e-test@midday.ai");
    expect(data).toHaveProperty("invoiceCount");
    expect(data).toHaveProperty("projectCount");
    expect(data).toHaveProperty("tags");
    expect(data).toHaveProperty("enrichmentStatus");
    expect(data).toHaveProperty("enrichedAt");
    expect(data).toHaveProperty("description");
    createdIds.push(data.id);
  });

  test("GET /customers -> 200 with list", async () => {
    const { status, data } = await api<any>("GET", "/customers");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.meta).toHaveProperty("hasNextPage");
    expect(data.meta).toHaveProperty("hasPreviousPage");
  });

  test("GET /customers/:id -> 200", async () => {
    const id = createdIds[0];
    if (!id) return;

    const { status, data } = await api<any>("GET", `/customers/${id}`);

    expect(status).toBe(200);
    expect(data.id).toBe(id);
    expect(data.name).toBe("E2E Test Customer");
    expect(data).toHaveProperty("invoiceCount");
    expect(data).toHaveProperty("tags");
    expect(data).toHaveProperty("enrichmentStatus");
    expect(data).toHaveProperty("enrichedAt");
  });

  test("PATCH /customers/:id -> 200", async () => {
    const id = createdIds[0];
    if (!id) return;

    const { status, data } = await api<any>("PATCH", `/customers/${id}`, {
      name: "E2E Updated Customer",
      email: "e2e-updated@midday.ai",
    });

    expect(status).toBe(200);
    expect(data.id).toBe(id);
    expect(data.name).toBe("E2E Updated Customer");
    expect(data.email).toBe("e2e-updated@midday.ai");
    expect(data).toHaveProperty("enrichmentStatus");
    expect(data).toHaveProperty("enrichedAt");
  });

  test("DELETE /customers/:id -> 200", async () => {
    const id = createdIds.pop();
    if (!id) return;

    const { status, data } = await api<any>("DELETE", `/customers/${id}`);

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// Tags CRUD
// ---------------------------------------------------------------------------
describe("Tags CRUD", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await api("DELETE", `/tags/${id}`);
    }
  });

  test("POST /tags -> 201", async () => {
    const { status, data } = await api<any>("POST", "/tags", {
      name: `e2e-tag-${Date.now()}`,
    });

    expect(status).toBe(201);
    expect(data.id).toBeDefined();
    expect(data.name).toContain("e2e-tag-");
    createdIds.push(data.id);
  });

  test("GET /tags -> 200", async () => {
    const { status, data } = await api<any>("GET", "/tags");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /tags/:id -> 200", async () => {
    const id = createdIds[0];
    if (!id) return;

    const { status, data } = await api<any>("GET", `/tags/${id}`);

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });

  test("PATCH /tags/:id -> 200", async () => {
    const id = createdIds[0];
    if (!id) return;

    const { status, data } = await api<any>("PATCH", `/tags/${id}`, {
      name: `e2e-tag-updated-${Date.now()}`,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(id);
    expect(data.name).toContain("e2e-tag-updated-");
  });

  test("DELETE /tags/:id -> 200", async () => {
    const id = createdIds.pop();
    if (!id) return;

    const { status, data } = await api<any>("DELETE", `/tags/${id}`);

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// Tracker Projects CRUD
// ---------------------------------------------------------------------------
describe("Tracker Projects CRUD", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await api("DELETE", `/tracker-projects/${id}`);
    }
  });

  test("POST /tracker-projects -> 200", async () => {
    const { status, data } = await api<any>("POST", "/tracker-projects", {
      name: `E2E Project ${Date.now()}`,
    });

    expect(status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.name).toContain("E2E Project");
    createdIds.push(data.id);
  });

  test("GET /tracker-projects -> 200", async () => {
    const { status, data } = await api<any>("GET", "/tracker-projects");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /tracker-projects/:id -> 200", async () => {
    const id = createdIds[0];
    if (!id) return;

    const { status, data } = await api<any>("GET", `/tracker-projects/${id}`);

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });

  test("PATCH /tracker-projects/:id -> 200", async () => {
    const id = createdIds[0];
    if (!id) return;

    const { status, data } = await api<any>(
      "PATCH",
      `/tracker-projects/${id}`,
      { name: `E2E Project Updated ${Date.now()}` },
    );

    expect(status).toBe(200);
    expect(data.id).toBe(id);
    expect(data.name).toContain("E2E Project Updated");
  });

  test("DELETE /tracker-projects/:id -> 200", async () => {
    const id = createdIds.pop();
    if (!id) return;

    const { status, data } = await api<any>(
      "DELETE",
      `/tracker-projects/${id}`,
    );

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// Tracker Entries CRUD (requires a project)
// ---------------------------------------------------------------------------
describe("Tracker Entries CRUD", () => {
  let projectId: string | null = null;
  const createdEntryIds: string[] = [];

  afterAll(async () => {
    for (const id of createdEntryIds) {
      await api("DELETE", `/tracker-entries/${id}`);
    }
    if (projectId) {
      await api("DELETE", `/tracker-projects/${projectId}`);
    }
  });

  test("setup: create project for entries", async () => {
    const { status, data } = await api<any>("POST", "/tracker-projects", {
      name: `E2E Entry Project ${Date.now()}`,
    });
    expect(status).toBe(200);
    projectId = data.id;
  });

  test("POST /tracker-entries -> 201", async () => {
    if (!projectId) return;

    const today = new Date().toISOString().split("T")[0]!;
    const { status, data } = await api<any>("POST", "/tracker-entries", {
      projectId,
      start: `${today}T09:00:00.000Z`,
      stop: `${today}T10:00:00.000Z`,
      dates: [today],
      duration: 3600,
    });

    expect([200, 201]).toContain(status);
    const entries = Array.isArray(data) ? data : (data as any)?.data;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      createdEntryIds.push(entry.id);
    }
  });

  test("GET /tracker-entries -> 200", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const { status, data } = await api<any>(
      "GET",
      `/tracker-entries?from=${today}&to=${today}`,
    );

    expect(status).toBe(200);
    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("result");
  });

  test("PATCH /tracker-entries/:id -> 200", async () => {
    const id = createdEntryIds[0];
    if (!id || !projectId) return;

    const today = new Date().toISOString().split("T")[0]!;
    const { status, data } = await api<any>("PATCH", `/tracker-entries/${id}`, {
      projectId,
      start: `${today}T10:00:00.000Z`,
      stop: `${today}T11:00:00.000Z`,
      dates: [today],
      duration: 3600,
    });

    expect(status).toBe(200);
    const entries = data?.data ?? data;
    const entry = Array.isArray(entries) ? entries[0] : entries;
    expect(entry?.id).toBe(id);
  });

  test("DELETE /tracker-entries/:id -> 200", async () => {
    const id = createdEntryIds.pop();
    if (!id) return;

    const { status } = await api<any>("DELETE", `/tracker-entries/${id}`);

    expect(status).toBe(200);
  });

  test("GET /tracker-entries/timer/status -> 200", async () => {
    const { status, data } = await api<any>(
      "GET",
      "/tracker-entries/timer/status",
    );

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("isRunning");
  });

  test("GET /tracker-entries/timer/current -> 200", async () => {
    const { status } = await api<any>("GET", "/tracker-entries/timer/current");

    expect(status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Tracker Entries Timer (start/stop cycle with cleanup)
// ---------------------------------------------------------------------------
describe("Tracker Entries Timer", () => {
  let timerProjectId: string | null = null;
  let timerEntryId: string | null = null;

  afterAll(async () => {
    if (timerEntryId) {
      await api("DELETE", `/tracker-entries/${timerEntryId}`);
    }
    if (timerProjectId) {
      await api("DELETE", `/tracker-projects/${timerProjectId}`);
    }
  });

  test("setup: create project for timer", async () => {
    const { status, data } = await api<any>("POST", "/tracker-projects", {
      name: `E2E Timer Project ${Date.now()}`,
    });
    expect(status).toBe(200);
    timerProjectId = data.id;
  });

  test("POST /tracker-entries/timer/start -> 200", async () => {
    if (!timerProjectId) return;

    const { status, data } = await api<any>(
      "POST",
      "/tracker-entries/timer/start",
      { projectId: timerProjectId },
    );

    expect([200, 201]).toContain(status);
    const entry = data?.data ?? data;
    if (entry?.id) timerEntryId = entry.id;
  });

  test("POST /tracker-entries/timer/stop -> 200 (discarded if <60s)", async () => {
    if (!timerEntryId) return;

    const { status, data } = await api<any>(
      "POST",
      "/tracker-entries/timer/stop",
      { entryId: timerEntryId },
    );

    expect(status).toBe(200);

    if (data?.data?.discarded) {
      timerEntryId = null;
    }
  });
});

// ---------------------------------------------------------------------------
// Tracker Entries Bulk (create + cleanup)
// ---------------------------------------------------------------------------
describe("Tracker Entries Bulk", () => {
  let bulkProjectId: string | null = null;
  const bulkEntryIds: string[] = [];

  afterAll(async () => {
    for (const id of bulkEntryIds) {
      await api("DELETE", `/tracker-entries/${id}`);
    }
    if (bulkProjectId) {
      await api("DELETE", `/tracker-projects/${bulkProjectId}`);
    }
  });

  test("setup: create project for bulk entries", async () => {
    const { status, data } = await api<any>("POST", "/tracker-projects", {
      name: `E2E Bulk Project ${Date.now()}`,
    });
    expect(status).toBe(200);
    bulkProjectId = data.id;
  });

  test("POST /tracker-entries/bulk -> 200", async () => {
    if (!bulkProjectId) return;

    const today = new Date().toISOString().split("T")[0]!;
    const { status, data } = await api<any>("POST", "/tracker-entries/bulk", {
      entries: [
        {
          projectId: bulkProjectId,
          start: `${today}T08:00:00.000Z`,
          stop: `${today}T09:00:00.000Z`,
          dates: [today],
          duration: 3600,
        },
        {
          projectId: bulkProjectId,
          start: `${today}T13:00:00.000Z`,
          stop: `${today}T14:00:00.000Z`,
          dates: [today],
          duration: 3600,
        },
      ],
    });

    expect([200, 201]).toContain(status);
    const entries = data?.data ?? data;
    if (Array.isArray(entries)) {
      for (const e of entries) {
        if (e?.id) bulkEntryIds.push(e.id);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Users (read + update with restore)
// ---------------------------------------------------------------------------
describe("Users", () => {
  let originalLocale: string | null = null;

  test("GET /users/me -> 200", async () => {
    const { status, data } = await api<any>("GET", "/users/me");

    expect(status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.email).toBeDefined();
    expect(data.fullName).toBeDefined();
    expect(data).toHaveProperty("team");
    expect(data).toHaveProperty("fileKey");
    originalLocale = data.locale;
  });

  test("PATCH /users/me -> 200 (update + restore)", async () => {
    const testLocale = originalLocale === "sv" ? "en" : "sv";

    const { status, data } = await api<any>("PATCH", "/users/me", {
      locale: testLocale,
    });

    expect(status).toBe(200);
    expect(data.locale).toBe(testLocale);
    expect(data).toHaveProperty("team");
    expect(data).toHaveProperty("fileKey");

    // Restore original
    await api("PATCH", "/users/me", { locale: originalLocale });
  });
});

// ---------------------------------------------------------------------------
// Teams (read + update with restore)
// ---------------------------------------------------------------------------
describe("Teams", () => {
  let teamId: string | null = null;
  let originalBaseCurrency: string | null = null;

  test("GET /teams -> 200", async () => {
    const { status, data } = await api<any>("GET", "/teams");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      expect(data.data[0]).toHaveProperty("name");

      // The API key is scoped to a single team. Find it by probing
      // GET /teams/:id which enforces the token-team check.
      for (const team of data.data) {
        const res = await api<any>("GET", `/teams/${team.id}`);
        if (res.status === 200) {
          teamId = team.id;
          break;
        }
      }
      expect(teamId).not.toBeNull();
    }
  });

  test("GET /teams/:id -> 200", async () => {
    if (!teamId) return;

    const { status, data } = await api<any>("GET", `/teams/${teamId}`);

    expect(status).toBe(200);
    expect(data.id).toBe(teamId);
    expect(data).toHaveProperty("name");
    originalBaseCurrency = data.baseCurrency;
  });

  test("PATCH /teams/:id -> 200 (update + restore)", async () => {
    if (!teamId) return;

    const testCurrency = originalBaseCurrency === "EUR" ? "USD" : "EUR";
    const { status, data } = await api<any>("PATCH", `/teams/${teamId}`, {
      baseCurrency: testCurrency,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(teamId);

    await api("PATCH", `/teams/${teamId}`, {
      baseCurrency: originalBaseCurrency,
    });
  });

  test("GET /teams/:id/members -> 200", async () => {
    if (!teamId) return;

    const { status, data } = await api<any>("GET", `/teams/${teamId}/members`);

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bank Accounts CRUD
// ---------------------------------------------------------------------------
describe("Bank Accounts CRUD", () => {
  let existingAccountId: string | null = null;
  let createdAccountId: string | null = null;

  afterAll(async () => {
    if (createdAccountId) {
      await api("DELETE", `/bank-accounts/${createdAccountId}`);
    }
  });

  test("GET /bank-accounts -> 200", async () => {
    const { status, data } = await api<any>("GET", "/bank-accounts");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      existingAccountId = data.data[0].id;
    }
  });

  test("GET /bank-accounts/:id -> 200", async () => {
    if (!existingAccountId) return;

    const { status, data } = await api<any>(
      "GET",
      `/bank-accounts/${existingAccountId}`,
    );

    expect(status).toBe(200);
    expect(data.id).toBe(existingAccountId);
  });

  test("POST /bank-accounts -> 200", async () => {
    const { status, data } = await api<any>("POST", "/bank-accounts", {
      name: `E2E Manual Account ${Date.now()}`,
      currency: "USD",
      manual: true,
    });

    expect([200, 201]).toContain(status);
    expect(data.id).toBeDefined();
    createdAccountId = data.id;
  });

  test("PATCH /bank-accounts/:id -> 200", async () => {
    if (!createdAccountId) return;

    const { status, data } = await api<any>(
      "PATCH",
      `/bank-accounts/${createdAccountId}`,
      { name: `E2E Updated Account ${Date.now()}` },
    );

    expect(status).toBe(200);
    expect(data.id).toBe(createdAccountId);
  });

  test("DELETE /bank-accounts/:id -> 200", async () => {
    if (!createdAccountId) return;

    const { status } = await api<any>(
      "DELETE",
      `/bank-accounts/${createdAccountId}`,
    );

    expect(status).toBe(200);
    createdAccountId = null;
  });
});

// ---------------------------------------------------------------------------
// Transactions CRUD + Bulk
// ---------------------------------------------------------------------------
describe("Transactions CRUD", () => {
  let bankAccountId: string | null = null;
  const createdTxnIds: string[] = [];

  afterAll(async () => {
    if (createdTxnIds.length > 0) {
      await api("DELETE", "/transactions/bulk", createdTxnIds);
    }
    if (bankAccountId) {
      await api("DELETE", `/bank-accounts/${bankAccountId}`);
    }
  });

  test("setup: create bank account for transactions", async () => {
    const { status, data } = await api<any>("POST", "/bank-accounts", {
      name: `E2E Txn Account ${Date.now()}`,
      currency: "USD",
      manual: true,
    });
    expect([200, 201]).toContain(status);
    bankAccountId = data.id;
  });

  test("GET /transactions -> 200", async () => {
    const { status, data } = await api<any>("GET", "/transactions");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("POST /transactions -> 200", async () => {
    if (!bankAccountId) return;

    const { status, data } = await api<any>("POST", "/transactions", {
      name: "E2E Test Transaction",
      amount: 99.99,
      currency: "USD",
      date: new Date().toISOString(),
      bankAccountId,
    });

    expect([200, 201]).toContain(status);
    expect(data.id).toBeDefined();
    createdTxnIds.push(data.id);
  });

  test("GET /transactions/:id -> 200", async () => {
    const id = createdTxnIds[0];
    if (!id) return;

    const { status, data } = await api<any>("GET", `/transactions/${id}`);

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });

  test("PATCH /transactions/:id -> 200", async () => {
    const id = createdTxnIds[0];
    if (!id) return;

    const { status, data } = await api<any>("PATCH", `/transactions/${id}`, {
      note: "Updated by E2E test",
    });

    expect(status).toBe(200);
    expect(data.id).toBe(id);
  });

  test("POST /transactions/bulk -> 200", async () => {
    if (!bankAccountId) return;

    const { status, data } = await api<any>("POST", "/transactions/bulk", [
      {
        name: "E2E Bulk Txn 1",
        amount: 10.0,
        currency: "USD",
        date: new Date().toISOString(),
        bankAccountId,
      },
      {
        name: "E2E Bulk Txn 2",
        amount: 20.0,
        currency: "USD",
        date: new Date().toISOString(),
        bankAccountId,
      },
    ]);

    expect([200, 201]).toContain(status);
    const items = data?.data ?? data;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item?.id) createdTxnIds.push(item.id);
      }
    }
  });

  test("PATCH /transactions/bulk -> 200", async () => {
    if (createdTxnIds.length < 2) return;

    const { status } = await api<any>("PATCH", "/transactions/bulk", {
      ids: createdTxnIds.slice(0, 2),
      note: "Bulk updated by E2E",
    });

    expect(status).toBe(200);
  });

  test("DELETE /transactions/:id -> 200", async () => {
    const id = createdTxnIds.pop();
    if (!id) return;

    const { status } = await api<any>("DELETE", `/transactions/${id}`);

    expect(status).toBe(200);
  });

  test("DELETE /transactions/bulk -> 200", async () => {
    if (createdTxnIds.length === 0) return;

    const idsToDelete = [...createdTxnIds];
    const { status } = await api<any>(
      "DELETE",
      "/transactions/bulk",
      idsToDelete,
    );

    expect(status).toBe(200);
    createdTxnIds.length = 0;
  });
});

// ---------------------------------------------------------------------------
// Documents (list + get by ID + presigned-url + delete)
// ---------------------------------------------------------------------------
describe("Documents", () => {
  let firstDocId: string | null = null;

  test("GET /documents -> 200", async () => {
    const { status, data } = await api<any>("GET", "/documents");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      firstDocId = data.data[0].id;
    }
  });

  test("GET /documents/:id -> 200", async () => {
    if (!firstDocId) return;

    const { status, data } = await api<any>("GET", `/documents/${firstDocId}`);

    expect(status).toBe(200);
    expect(data.id).toBe(firstDocId);
  });

  test("POST /documents/:id/presigned-url -> 200", async () => {
    if (!firstDocId) return;

    const { status } = await api<any>(
      "POST",
      `/documents/${firstDocId}/presigned-url`,
    );

    expect([200, 404]).toContain(status);
  });

  test("DELETE /documents/:id -> 404 (nonexistent)", async () => {
    const { status } = await api<any>(
      "DELETE",
      "/documents/00000000-0000-0000-0000-000000000000",
    );

    expect([200, 404]).toContain(status);
  });
});

// ---------------------------------------------------------------------------
// Inbox (list + get by ID + patch with restore + presigned-url + delete)
// ---------------------------------------------------------------------------
describe("Inbox", () => {
  let firstInboxId: string | null = null;
  let originalDisplayName: string | null = null;

  test("GET /inbox -> 200", async () => {
    const { status, data } = await api<any>("GET", "/inbox");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      firstInboxId = data.data[0].id;
      originalDisplayName = data.data[0].displayName ?? null;
    }
  });

  test("GET /inbox/:id -> 200", async () => {
    if (!firstInboxId) return;

    const { status, data } = await api<any>("GET", `/inbox/${firstInboxId}`);

    expect(status).toBe(200);
    expect(data.id).toBe(firstInboxId);
  });

  test("PATCH /inbox/:id -> 200 (update + restore)", async () => {
    if (!firstInboxId) return;

    const testName = `E2E Updated ${Date.now()}`;
    const { status } = await api<any>("PATCH", `/inbox/${firstInboxId}`, {
      displayName: testName,
    });

    expect(status).toBe(200);

    if (originalDisplayName !== undefined) {
      await api("PATCH", `/inbox/${firstInboxId}`, {
        displayName: originalDisplayName || "Inbox Item",
      });
    }
  });

  test("POST /inbox/:id/presigned-url -> 200", async () => {
    if (!firstInboxId) return;

    const { status } = await api<any>(
      "POST",
      `/inbox/${firstInboxId}/presigned-url`,
    );

    expect([200, 404]).toContain(status);
  });

  test("DELETE /inbox/:id -> 404 (nonexistent)", async () => {
    const { status } = await api<any>(
      "DELETE",
      "/inbox/00000000-0000-0000-0000-000000000000",
    );

    expect([200, 404]).toContain(status);
  });
});

// ---------------------------------------------------------------------------
// Invoices (list + get + summary + payment-status + create + update + delete)
// ---------------------------------------------------------------------------
describe("Invoices", () => {
  let firstInvoiceId: string | null = null;
  let createdInvoiceId: string | null = null;
  let testCustomerId: string | null = null;

  afterAll(async () => {
    if (createdInvoiceId) {
      await api("DELETE", `/invoices/${createdInvoiceId}`);
    }
    if (testCustomerId) {
      await api("DELETE", `/customers/${testCustomerId}`);
    }
  });

  test("GET /invoices -> 200", async () => {
    const { status, data } = await api<any>("GET", "/invoices");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      firstInvoiceId = data.data[0].id;
    }
  });

  test("GET /invoices/:id -> 200", async () => {
    if (!firstInvoiceId) return;

    const { status, data } = await api<any>(
      "GET",
      `/invoices/${firstInvoiceId}`,
    );

    expect(status).toBe(200);
    expect(data.id).toBe(firstInvoiceId);
  });

  test("GET /invoices/summary -> 200", async () => {
    const { status, data } = await api<any>("GET", "/invoices/summary");

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("GET /invoices/payment-status -> 200", async () => {
    const { status, data } = await api<any>("GET", "/invoices/payment-status");

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("POST /invoices -> 200 (draft)", async () => {
    const custRes = await api<any>("POST", "/customers", {
      name: "E2E Invoice Customer",
      email: "e2e-invoice@midday.ai",
    });
    if (custRes.status === 201) testCustomerId = custRes.data.id;
    if (!testCustomerId) return;

    const tiptapBlock = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "E2E test" }] },
      ],
    };

    const { status, data } = await api<any>("POST", "/invoices", {
      template: tiptapBlock,
      fromDetails: tiptapBlock,
      customerId: testCustomerId,
      paymentDetails: tiptapBlock,
      noteDetails: tiptapBlock,
      deliveryType: "create",
      lineItems: [
        {
          name: tiptapBlock,
          quantity: 1,
          price: 100,
        },
      ],
    });

    expect([200, 201]).toContain(status);
    if (data?.id) createdInvoiceId = data.id;
  });

  test("PUT /invoices/:id -> 200 (update note)", async () => {
    if (!createdInvoiceId) return;

    const { status } = await api<any>("PUT", `/invoices/${createdInvoiceId}`, {
      internalNote: "Updated by E2E test",
    });

    expect(status).toBe(200);
  });

  test("PUT /invoices/:id -> 200 (cancel for deletion)", async () => {
    if (!createdInvoiceId) return;

    const { status } = await api<any>("PUT", `/invoices/${createdInvoiceId}`, {
      status: "canceled",
    });

    expect(status).toBe(200);
  });

  test("DELETE /invoices/:id -> 200", async () => {
    if (!createdInvoiceId) return;

    const { status } = await api<any>(
      "DELETE",
      `/invoices/${createdInvoiceId}`,
    );

    expect(status).toBe(200);
    createdInvoiceId = null;
  });
});

// ---------------------------------------------------------------------------
// Reports (read-only)
// ---------------------------------------------------------------------------
describe("Reports", () => {
  const dateRange = "from=2024-01-01&to=2025-12-31";

  test("GET /reports/revenue -> 200", async () => {
    const { status, data } = await api<any>(
      "GET",
      `/reports/revenue?${dateRange}`,
    );

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("GET /reports/profit -> 200", async () => {
    const { status, data } = await api<any>(
      "GET",
      `/reports/profit?${dateRange}`,
    );

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("GET /reports/burn-rate -> 200", async () => {
    const { status, data } = await api<any>(
      "GET",
      `/reports/burn-rate?${dateRange}`,
    );

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("GET /reports/expenses -> 200", async () => {
    const { status, data } = await api<any>(
      "GET",
      `/reports/expenses?${dateRange}`,
    );

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("GET /reports/spending -> 200", async () => {
    const { status, data } = await api<any>(
      "GET",
      `/reports/spending?${dateRange}`,
    );

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  test("GET /reports/runway -> 200", async () => {
    const { status, data } = await api<any>("GET", "/reports/runway");

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Search (read-only)
// ---------------------------------------------------------------------------
describe("Search", () => {
  test("GET /search -> 200", async () => {
    const { status, data } = await api<any>("GET", "/search?searchTerm=test");

    expect(status).toBe(200);
    expect(data).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Notifications (list + status update with restore)
// ---------------------------------------------------------------------------
describe("Notifications", () => {
  let firstNotificationId: string | null = null;
  let originalStatus: string | null = null;

  test("GET /notifications -> 200", async () => {
    const { status, data } = await api<any>("GET", "/notifications");

    expect(status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      firstNotificationId = data.data[0].id;
      originalStatus = data.data[0].status;
    }
  });

  test("PATCH /notifications/:id/status -> 200 (update + restore)", async () => {
    if (!firstNotificationId || !originalStatus) return;

    const newStatus = originalStatus === "read" ? "unread" : "read";
    const { status } = await api<any>(
      "PATCH",
      `/notifications/${firstNotificationId}/status`,
      { status: newStatus },
    );

    expect(status).toBe(200);

    await api("PATCH", `/notifications/${firstNotificationId}/status`, {
      status: originalStatus,
    });
  });

  test("POST /notifications/update-all-status -> 200 (update + restore)", async () => {
    const snapshot = await api<any>("GET", "/notifications");
    const allNotifications: { id: string; status: string }[] =
      snapshot.data?.data ?? [];

    const { status } = await api<any>(
      "POST",
      "/notifications/update-all-status",
      { status: "read" },
    );

    expect(status).toBe(200);

    for (const n of allNotifications) {
      if (n.status !== "read") {
        await api("PATCH", `/notifications/${n.id}/status`, {
          status: n.status,
        });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Auth / error handling
// ---------------------------------------------------------------------------
describe("Auth & Error Handling", () => {
  test("Missing auth header -> 401", async () => {
    const res = await fetch(`${BASE_URL}/customers`);
    expect(res.status).toBe(401);
  });

  test("Invalid bearer token -> 401", async () => {
    const res = await fetch(`${BASE_URL}/customers`, {
      headers: { Authorization: "Bearer invalid_token_here" },
    });
    expect(res.status).toBe(401);
  });

  test("GET nonexistent customer -> 404 or empty", async () => {
    const { status } = await api(
      "GET",
      "/customers/00000000-0000-0000-0000-000000000000",
    );
    expect([200, 404]).toContain(status);
  });

  test("POST /customers with invalid body -> 400", async () => {
    const { status } = await api("POST", "/customers", {
      name: "",
    });
    expect([400, 422]).toContain(status);
  });
});
