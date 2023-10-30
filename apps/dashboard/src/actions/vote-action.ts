"use server";

import { client } from "@midday/kv";
import { revalidatePath as revalidatePathFunc } from "next/cache";

export const voteAction = async (id: string, revalidatePath: string) => {
  await client.incr(id);
  revalidatePathFunc(revalidatePath);
};
