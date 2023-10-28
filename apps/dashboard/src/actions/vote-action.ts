"use server";

import { createClient } from "@vercel/kv";
import { revalidatePath } from "next/cache";

export const voteAction = async (id: string, path: string) => {
  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  await kv.incr(id);

  revalidatePath(path);
};
