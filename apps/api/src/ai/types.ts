import type { Database } from "@db/client";

export type ToolContext = {
  db: Database;
  teamId: string;
  userId: string;
  locale?: string | null;
};
