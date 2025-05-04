import "server-only";

import { cache } from "react";
import { createClient } from "../client/server";

// Cache per request
export const getSession = cache(async () => {
  const supabase = await createClient();

  return supabase.auth.getSession();
});
