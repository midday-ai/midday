"use server";

import { client } from "@midday/kv";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { voteSchema } from "./schema";

export const voteAction = action(voteSchema, async ({ revalidatePath, id }) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const hasUser = await client.sadd(
    `apps:v2:${id}:user:${session.user.id}`,
    true
  );

  if (!hasUser) {
    throw new Error("You have already voted");
  }

  await client.incr(`apps:v2:${id}`);

  revalidatePathFunc(revalidatePath);
});
