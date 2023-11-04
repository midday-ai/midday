import { unstable_cache } from "next/cache";
import { createClient } from "../client/server";
import {
  getBankConnectionsByTeamIdQuery,
  getTransactionsQuery,
  getUserQuery,
} from "../queries";

export const getCachedTransactions = unstable_cache(
  async (params) => {
    const supabase = await createClient();
    return getTransactionsQuery(supabase, params);
  },
  ["transactions"],
  { tags: ["transactions"] },
);

export const getUser = async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;

  if (!userId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, userId);
    },
    [`user-${userId}`],
    {
      tags: [`user-${userId}`],
    },
  )();
};

export const getBankConnectionsByTeamId = async () => {
  const supabase = await createClient();
  const user = await getUser();
  const userId = user?.data?.id;

  if (!userId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getBankConnectionsByTeamIdQuery(supabase, userId);
    },
    [`user-${userId}`],
    {
      tags: [`user-${userId}`],
    },
  )();
};
