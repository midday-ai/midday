"use server";

import { client } from "@midday/kv";

export async function setViewCount(path: string) {
  return client.incr(`views-${path}`);
}
