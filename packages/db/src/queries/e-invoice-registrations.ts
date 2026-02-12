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
