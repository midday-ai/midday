import { and, desc, eq, notInArray } from "drizzle-orm";
import type { Database, DatabaseOrTransaction } from "../client";
import { eInvoiceRegistrations } from "../schema";

// ---------------------------------------------------------------------------
// Shared field type for Invopop-compatible fault objects
// ---------------------------------------------------------------------------

type Fault = { message: string; [key: string]: unknown };

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

type GetEInvoiceRegistrationParams = {
  teamId: string;
  provider: string;
};

export const getEInvoiceRegistration = async (
  db: Database,
  params: GetEInvoiceRegistrationParams,
) => {
  const [result] = await db
    .select()
    .from(eInvoiceRegistrations)
    .where(
      and(
        eq(eInvoiceRegistrations.teamId, params.teamId),
        eq(eInvoiceRegistrations.provider, params.provider),
      ),
    )
    .orderBy(desc(eInvoiceRegistrations.updatedAt))
    .limit(1);

  return result ?? null;
};

// ---------------------------------------------------------------------------
// Read by Peppol ID (for incoming document routing)
// ---------------------------------------------------------------------------

type GetRegistrationByPeppolIdParams = {
  peppolId: string;
};

export const getRegistrationByPeppolId = async (
  db: Database,
  params: GetRegistrationByPeppolIdParams,
) => {
  const [result] = await db
    .select()
    .from(eInvoiceRegistrations)
    .where(
      and(
        eq(eInvoiceRegistrations.peppolId, params.peppolId),
        eq(eInvoiceRegistrations.status, "registered"),
      ),
    )
    .limit(1);

  return result ?? null;
};

// ---------------------------------------------------------------------------
// Update by id
// ---------------------------------------------------------------------------

type UpdateEInvoiceRegistrationParams = {
  id: string;
  status: string;
  faults?: Fault[] | null;
  siloEntryId?: string | null;
  peppolId?: string | null;
  peppolScheme?: string | null;
  registrationUrl?: string | null;
};

export const updateEInvoiceRegistration = async (
  db: DatabaseOrTransaction,
  params: UpdateEInvoiceRegistrationParams,
) => {
  const { id, ...fields } = params;

  await db
    .update(eInvoiceRegistrations)
    .set({
      ...fields,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(eInvoiceRegistrations.id, id));
};

// ---------------------------------------------------------------------------
// Update by teamId + provider (used by webhook / worker where id is unknown)
// ---------------------------------------------------------------------------

type UpdateEInvoiceRegistrationByTeamParams = {
  teamId: string;
  provider: string;
  status: string;
  faults?: Fault[] | null;
  siloEntryId?: string | null;
  peppolId?: string | null;
  peppolScheme?: string | null;
  registrationUrl?: string | null;
};

export const updateEInvoiceRegistrationByTeam = async (
  db: DatabaseOrTransaction,
  params: UpdateEInvoiceRegistrationByTeamParams,
) => {
  const { teamId, provider, ...fields } = params;

  await db
    .update(eInvoiceRegistrations)
    .set({
      ...fields,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(eInvoiceRegistrations.teamId, teamId),
        eq(eInvoiceRegistrations.provider, provider),
      ),
    );
};

// ---------------------------------------------------------------------------
// Upsert (atomic insert-or-update keyed on team_id + provider)
// ---------------------------------------------------------------------------

type UpsertEInvoiceRegistrationParams = {
  teamId: string;
  provider: string;
  status?: string;
  faults?: Fault[] | null;
};

export const upsertEInvoiceRegistration = async (
  db: DatabaseOrTransaction,
  params: UpsertEInvoiceRegistrationParams,
) => {
  const status = params.status ?? "pending";

  const [result] = await db
    .insert(eInvoiceRegistrations)
    .values({
      teamId: params.teamId,
      provider: params.provider,
      status,
      faults: params.faults ?? null,
    })
    .onConflictDoUpdate({
      target: [eInvoiceRegistrations.teamId, eInvoiceRegistrations.provider],
      set: {
        status,
        faults: params.faults ?? null,
        updatedAt: new Date().toISOString(),
      },
      where: notInArray(eInvoiceRegistrations.status, [
        "registered",
        "processing",
      ]),
    })
    .returning();

  return result;
};
