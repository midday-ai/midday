/**
 * Invopop API Client
 *
 * Thin wrapper around the Invopop REST API for e-invoicing.
 * Base URL: https://api.invopop.com
 * Auth: Bearer JWT token per workspace.
 */

import type {
  GOBLBuildRequest,
  GOBLBuildResponse,
  InvopopJob,
  InvopopSiloEntry,
  InvopopValidationError,
  InvopopWorkflowCollection,
} from "./types";

const BASE_URL = "https://api.invopop.com";
const TIMEOUT_MS = 15_000;

class InvopopApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "InvopopApiError";
    this.status = status;
    this.body = body;
  }
}

class InvopopValidationApiError extends InvopopApiError {
  validation: InvopopValidationError;

  constructor(status: number, validation: InvopopValidationError) {
    super(validation.message || "Validation error", status, validation);
    this.name = "InvopopValidationApiError";
    this.validation = validation;
  }
}

async function request<T>(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Check if it's a validation error (422 or 4xx with key/fields)
    if (
      data &&
      typeof data === "object" &&
      "key" in data &&
      data.key === "validation"
    ) {
      throw new InvopopValidationApiError(
        res.status,
        data as InvopopValidationError,
      );
    }

    throw new InvopopApiError(
      `Invopop API error: ${res.status} ${res.statusText}`,
      res.status,
      data,
    );
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

/** Verify API key is valid by pinging the API. */
export async function ping(apiKey: string): Promise<boolean> {
  try {
    const res = await request<{ ping: string }>(
      apiKey,
      "GET",
      "/utils/v1/ping",
    );
    return res.ping === "pong";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// GOBL
// ---------------------------------------------------------------------------

/**
 * Validate and calculate a GOBL document without storing it.
 * Useful for pre-submission validation.
 */
export async function buildDocument(
  apiKey: string,
  data: Record<string, unknown> | object,
): Promise<GOBLBuildResponse> {
  const body: GOBLBuildRequest = { data: data as Record<string, unknown> };
  return request<GOBLBuildResponse>(
    apiKey,
    "POST",
    "/silo/v1/gobl/build",
    body,
  );
}

// ---------------------------------------------------------------------------
// Silo Entries
// ---------------------------------------------------------------------------

/**
 * Create a new silo entry from GOBL data.
 * The data is validated, calculated, and stored.
 * Use `key` for idempotency (e.g. "midday-invoice-{invoiceId}").
 * Use `folder` to organise entries in the Invopop console
 * (e.g. "invoices", "suppliers").
 */
export async function createEntry(
  apiKey: string,
  data: Record<string, unknown> | object,
  key?: string,
  folder?: string,
): Promise<InvopopSiloEntry> {
  return request<InvopopSiloEntry>(apiKey, "POST", "/silo/v1/entries", {
    data,
    ...(key && { key }),
    ...(folder && { folder }),
  });
}

/** Fetch an existing silo entry by UUID. */
export async function fetchEntry(
  apiKey: string,
  entryId: string,
): Promise<InvopopSiloEntry> {
  return request<InvopopSiloEntry>(
    apiKey,
    "GET",
    `/silo/v1/entries/${entryId}`,
  );
}

/** Fetch an existing silo entry by its idempotency key. */
export async function fetchEntryByKey(
  apiKey: string,
  key: string,
): Promise<InvopopSiloEntry> {
  return request<InvopopSiloEntry>(
    apiKey,
    "GET",
    `/silo/v1/entries/key/${encodeURIComponent(key)}`,
  );
}

/**
 * Update an existing silo entry.
 * Can provide full replacement data or use patch content types.
 */
export async function updateEntry(
  apiKey: string,
  entryId: string,
  data: Record<string, unknown> | object,
): Promise<InvopopSiloEntry> {
  return request<InvopopSiloEntry>(
    apiKey,
    "PATCH",
    `/silo/v1/entries/${entryId}`,
    { data },
  );
}

// ---------------------------------------------------------------------------
// Transform Workflows
// ---------------------------------------------------------------------------

/** Fetch all workflows available in the workspace. */
export async function fetchWorkflows(
  apiKey: string,
  schema?: string,
): Promise<InvopopWorkflowCollection> {
  const params = new URLSearchParams();
  if (schema) params.set("schema", schema);
  const qs = params.toString();
  return request<InvopopWorkflowCollection>(
    apiKey,
    "GET",
    `/transform/v1/workflows${qs ? `?${qs}` : ""}`,
  );
}

// ---------------------------------------------------------------------------
// Transform Jobs
// ---------------------------------------------------------------------------

/**
 * Create a new job to process a silo entry through a workflow.
 * Returns 202 Accepted. Use webhooks or fetchJob to track completion.
 */
export async function createJob(
  apiKey: string,
  workflowId: string,
  siloEntryId: string,
  key?: string,
): Promise<InvopopJob> {
  return request<InvopopJob>(apiKey, "POST", "/transform/v1/jobs", {
    workflow_id: workflowId,
    silo_entry_id: siloEntryId,
    ...(key && { key }),
  });
}

/** Fetch a job by UUID to check its status. */
export async function fetchJob(
  apiKey: string,
  jobId: string,
): Promise<InvopopJob> {
  return request<InvopopJob>(apiKey, "GET", `/transform/v1/jobs/${jobId}`);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/**
 * Check if an error is a 409 Conflict (idempotency key already used).
 * Useful for callers that want to recover from duplicate submissions
 * rather than treating them as fatal errors.
 */
export function isConflictError(err: unknown): boolean {
  return err instanceof InvopopApiError && err.status === 409;
}

export { InvopopApiError, InvopopValidationApiError };
