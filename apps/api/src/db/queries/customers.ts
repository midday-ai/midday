import type { Database } from "@api/db";
import { customers } from "@api/db/schema";
import { eq } from "drizzle-orm";

export const getCustomerById = async (db: Database, { id }: { id: string }) => {
  const [result] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  return result;
};

export const getCustomersByTeamId = async (
  db: Database,
  { teamId }: { teamId: string },
) => {
  const [result] = await db
    .select()
    .from(customers)
    .where(eq(customers.teamId, teamId));

  return result;
};
