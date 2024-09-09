"use server";

import { authActionClient } from "../safe-action";
import { clearChats } from "./storage";

export const clearHistoryAction = authActionClient
  .metadata({
    name: "clear-history",
  })
  .action(async ({ ctx: { user } }) => {
    return clearChats({
      teamId: user?.team_id,
      userId: user?.id,
    });
  });
