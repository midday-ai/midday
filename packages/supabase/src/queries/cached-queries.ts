import { unstable_cache } from "next/cache";
import { createClient } from "../client/server";
import { getCurrentUser, getTransactions } from "../queries";

export const getCachedCurrentUser = unstable_cache(
  async () => {
    const supabase = await createClient();
    return getCurrentUser(supabase);
  },
  ["current-user"],
  { tags: ["current-user"] },
);

export const getCachedTransactions = unstable_cache(
  async (params) => {
    const supabase = await createClient();
    return getTransactions(supabase, params);
  },
  ["transactions"],
  { tags: ["transactions"] },
);
