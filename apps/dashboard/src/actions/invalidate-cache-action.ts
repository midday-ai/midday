"use server";

import { revalidateTag } from "next/cache";

export async function invalidateCacheAction(tags: string[]) {
  tags.map((tag) => {
    revalidateTag();
  });
}
