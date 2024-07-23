"use server";

import { authActionClient } from "../safe-action";
import { clearChats } from "./storage";

export const clearHistoryAction = authActionClient
  .metadata({
    name: "clear-history",
  })
  .action(async () => {
    return clearChats();
  });
