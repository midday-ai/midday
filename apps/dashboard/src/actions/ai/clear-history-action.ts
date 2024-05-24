"use server";

import { z } from "zod";
import { action } from "../safe-action";
import { deleteHistory } from "./storage";

export const clearHistoryAction = action(z.null(), async () => {
  return deleteHistory();
});
