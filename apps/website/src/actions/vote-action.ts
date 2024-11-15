"use server";

import { client } from "@midday/kv";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const voteAction = actionClient
  .schema(
    z.object({
      id: z.string(),
    }),
  )
  .action(async ({ parsedInput: { id } }) => {
    const clientIP = (await headers()).get("x-forwarded-for");

    const hasVoted = await client.sadd(`apps:${id}:ip:${clientIP}`, true);

    if (!hasVoted) {
      throw new Error("You have already voted");
    }

    await client.incr(`apps:${id}`);

    revalidatePath("/feature-request");
  });
