import { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache as cache } from "next/cache";

import { Database as BusinessDatabase } from "@midday/supabase/types";

/**
 * Fetches the subscription data for the specified client.
 *
 * @param client - The Supabase client to use.
 * @returns The subscription data.
 */
const getSubscriptionQuery = async <T extends BusinessDatabase>(
  client: SupabaseClient<T>,
) => {
  const { data: subscription, error } = await client
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .in("status", ["trialing", "active"])
    .maybeSingle();

  return subscription;
};

/**
 * Fetches the products data for the specified client.
 *
 * @param supabase - The Supabase client to use.
 * @returns The products data.
 */
const getProductsQuery = async <T extends BusinessDatabase>(
  client: SupabaseClient<T>,
) => {
  const { data: products, error } = await client
    .from("products")
    .select("*, prices(*)")
    .eq("active", true)
    .eq("prices.active", true)
    .order("metadata->index")
    .order("unit_amount", { foreignTable: "prices" });

  return products;
};

/**
 * Fetches the user subscriptions for the specified client.
 *
 * @param userId - The ID of the user.
 * @param client - The Supabase client to use.
 * @param invalidateCache - Whether to invalidate the cache.
 * @returns The user subscriptions.
 */
const getUserSubscriptions = async <T extends BusinessDatabase>(
  userId: string,
  client: SupabaseClient<T>,
  invalidateCache = false,
) => {
  if (invalidateCache) {
    return getSubscriptionQuery(client);
  }

  return cache(
    async () => {
      return getSubscriptionQuery(client);
    },
    ["user", "subscriptions", userId],
    {
      tags: [`user_subscriptions_${userId}`],
      revalidate: 180,
    },
  )();
};

/**
 * Fetches the products data for the specified client.
 *
 * @param client - The Supabase client to use.
 * @param invalidateCache - Whether to invalidate the cache.
 * @returns The products data.
 */
const getProducts = async <T extends BusinessDatabase>(
  client: SupabaseClient<T>,
  invalidateCache = false,
) => {
  if (invalidateCache) {
    return getProductsQuery(client);
  }

  return cache(
    async () => {
      return getProductsQuery(client);
    },
    ["products"],
    {
      tags: ["products"],
      revalidate: 180,
    },
  )();
};

export { getProducts, getUserSubscriptions };
