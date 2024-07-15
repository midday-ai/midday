"use server";

import { actionClient } from "../safe-action";
import { clearChats } from "./storage";

export const clearHistoryAction = actionClient.action(async () => {
  return clearChats();
});
