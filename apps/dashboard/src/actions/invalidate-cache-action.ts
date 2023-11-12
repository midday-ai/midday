"use server";

import { revalidateTag } from "next/cache";

export async function invalidateCacheAction(tags: string[]) {
  return Promise.all(tags.map(async (tag) => revalidateTag(tag)));
}
