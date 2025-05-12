import type { Database } from "@api/db";
import { userInvites } from "@api/db/schema";
import { eq } from "drizzle-orm";

export async function getUserInvitesQuery(db: Database, email: string) {
  return db.query.userInvites.findMany({
    where: eq(userInvites.email, email),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      team: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    columns: {
      id: true,
      email: true,
      code: true,
      role: true,
    },
  });
}
