import type { Scope } from "@api/utils/scopes";
import type { Database } from "@midday/db/client";

/**
 * REST API session type - extends the basic session with teamId
 * This is created by the auth middleware after fetching user data
 */
export type RestSession = {
  teamId: string;
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
  oauth?: {
    applicationId: string;
    clientId: string | undefined;
    applicationName: string | undefined;
  };
};

export type Context = {
  Variables: {
    db: Database;
    session: RestSession;
    teamId: string;
    userId?: string;
    clientIp?: string;
    scopes?: Scope[];
  };
};
