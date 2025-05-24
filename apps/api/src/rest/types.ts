import type { Database } from "@api/db";
import type { Session } from "@api/utils/auth";

export type Context = {
  Variables: {
    db: Database;
    session: Session;
    teamId: string;
  };
};
