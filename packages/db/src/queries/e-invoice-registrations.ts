import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { eInvoiceRegistrations } from "../schema";

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
    .limit(1);

  return result ?? null;
};

type UpdateEInvoiceRegistrationParams = {
  id: string;
  status: string;
  faults?: { message: string }[] | null;
  siloEntryId?: string | null;
  peppolId?: string | null;
  peppolScheme?: string | null;
  registrationUrl?: string | null;
};

export const updateEInvoiceRegistration = async (
  db: Database,
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

type CreateEInvoiceRegistrationParams = {
  teamId: string;
  provider: string;
  status?: string;
};

export const createEInvoiceRegistration = async (
  db: Database,
  params: CreateEInvoiceRegistrationParams,
) => {
  const [result] = await db
    .insert(eInvoiceRegistrations)
    .values({
      teamId: params.teamId,
      provider: params.provider,
      status: params.status ?? "pending",
    })
    .returning();

  return result;
};
