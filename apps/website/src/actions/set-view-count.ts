"use server";

import { client } from "@absplatform/kv";

export async function setViewCount(path: string) {
  return client.incr(`views-${path}`);
}
