import type { Scope } from "@api/utils/scopes";
import type { Database } from "@midday/db/client";
import type { Session } from "@midday/supabase/verify-token";

export type Context = {
  Variables: {
    db: Database;
    session: Session;
    teamId: string;
    userId?: string;
    clientIp?: string;
    scopes?: Scope[];
  };
};
