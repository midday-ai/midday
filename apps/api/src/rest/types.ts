import type { Session } from "@api/utils/auth";
import type { Database } from "@midday/db/client";
import type { AppEventEmitter } from "@midday/notifications";

export type Context = {
  Variables: {
    db: Database;
    events: AppEventEmitter;
    session: Session;
    teamId: string;
  };
};
